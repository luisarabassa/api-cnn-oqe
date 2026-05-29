const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const readline = require("readline");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 3000;
const MODEL_PATH = process.env.MODEL_PATH || path.join(__dirname, "models_saved", "model.pth");
const PYTHON_CMD = process.env.PYTHON_CMD || "python";

const RUNTIME_DIR = path.join(__dirname, ".runtime");
const UPLOAD_DIR = path.join(RUNTIME_DIR, "uploads");
const WORKER_PATH = path.join(RUNTIME_DIR, "inference_worker.py");

fs.mkdirSync(RUNTIME_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PYTHON_WORKER_CODE = String.raw`
import sys
import json
import argparse
import traceback

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image


class CNN(nn.Module):
    def __init__(self):
        super().__init__()

        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

        for param in resnet.parameters():
            param.requires_grad = False

        for param in resnet.layer3.parameters():
            param.requires_grad = True
        for param in resnet.layer4.parameters():
            param.requires_grad = True

        resnet.fc = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 6)
        )

        self.network = resnet

    def forward(self, x):
        return self.network(x)


def print_json(payload):
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def load_model(model_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    checkpoint = torch.load(
        model_path,
        map_location=device,
        weights_only=False
    )

    model = CNN().to(device)

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
        classes = checkpoint.get("classes", [])
        config = checkpoint.get("config", {})
    else:
        model.load_state_dict(checkpoint)
        classes = []
        config = {}

    model.eval()

    input_size = config.get("input_size", 128)

    transform = transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor()
    ])

    return model, classes, config, device, transform


def predict_image(model, classes, device, transform, image_path):
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        predicted_index = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[predicted_index].item())

    if classes and predicted_index < len(classes):
        predicted_class = classes[predicted_index]
    else:
        predicted_class = f"classe_indice_{predicted_index}_sem_nome_no_checkpoint"

    top_k = min(3, probabilities.shape[0])

    top_values, top_indices = torch.topk(probabilities, k=top_k)

    top_predictions = []

    for value, index in zip(top_values.tolist(), top_indices.tolist()):
        index = int(index)

        if classes and index < len(classes):
            class_name = classes[index]
        else:
            class_name = f"classe_indice_{index}_sem_nome_no_checkpoint"

        top_predictions.append({
            "class": class_name,
            "index": index,
            "confidence": float(value)
        })

    return {
        "predictedClass": predicted_class,
        "predictedIndex": predicted_index,
        "confidence": confidence,
        "topPredictions": top_predictions
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    args = parser.parse_args()

    try:
        model, classes, config, device, transform = load_model(args.model)

        print_json({
            "status": "ready",
            "message": "Modelo carregado com sucesso.",
            "device": device,
            "classes": classes,
            "config": config
        })

    except Exception as e:
        print_json({
            "status": "startup_error",
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        sys.exit(1)

    for line in sys.stdin:
        try:
            request = json.loads(line)

            request_id = request.get("id")
            image_path = request.get("imagePath")

            if not image_path:
                raise ValueError("Campo imagePath não foi informado.")

            result = predict_image(
                model=model,
                classes=classes,
                device=device,
                transform=transform,
                image_path=image_path
            )

            print_json({
                "id": request_id,
                "ok": True,
                "result": result
            })

        except Exception as e:
            print_json({
                "id": request.get("id") if "request" in locals() else None,
                "ok": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            })


if __name__ == "__main__":
    main()
`;

fs.writeFileSync(WORKER_PATH, PYTHON_WORKER_CODE, "utf8");

function validateModelFile() {
    if (!fs.existsSync(MODEL_PATH)) {
        console.error("\nERRO: arquivo .pth não encontrado.");
        console.error(`Caminho esperado: ${MODEL_PATH}`);
        console.error("\nCopie seu modelo treinado para:");
        console.error("models_saved/model.pth");
        process.exit(1);
    }
}

let workerProcess = null;
let workerReady = false;
let pendingRequests = new Map();

function startPythonWorker() {
    return new Promise((resolve, reject) => {
        workerProcess = spawn(PYTHON_CMD, [
            WORKER_PATH,
            "--model",
            MODEL_PATH
        ]);

        const rl = readline.createInterface({
            input: workerProcess.stdout
        });

        const startupTimeout = setTimeout(() => {
            reject(new Error("Timeout ao tentar carregar o modelo PyTorch."));
        }, 30000);

        rl.on("line", (line) => {
            let message;

            try {
                message = JSON.parse(line);
            } catch (error) {
                console.error("Saída inválida do worker Python:", line);
                return;
            }

            if (message.status === "ready") {
                clearTimeout(startupTimeout);
                workerReady = true;

                console.log("\nAPI iniciada com modelo carregado.");
                console.log(`Dispositivo usado pelo PyTorch: ${message.device}`);
                console.log(`Classes carregadas: ${JSON.stringify(message.classes)}`);

                resolve(message);
                return;
            }

            if (message.status === "startup_error") {
                clearTimeout(startupTimeout);

                console.error("\nERRO ao carregar o modelo:");
                console.error(message.message);
                console.error(message.traceback);

                reject(new Error(message.message));
                return;
            }

            if (message.id && pendingRequests.has(message.id)) {
                const { resolve, reject, timeout } = pendingRequests.get(message.id);

                clearTimeout(timeout);
                pendingRequests.delete(message.id);

                if (message.ok) {
                    resolve(message.result);
                } else {
                    reject(new Error(message.error));
                }
            }
        });

        workerProcess.stderr.on("data", (data) => {
            console.error("[Python stderr]", data.toString());
        });

        workerProcess.on("exit", (code) => {
            workerReady = false;

            if (pendingRequests.size > 0) {
                for (const [, request] of pendingRequests.entries()) {
                    clearTimeout(request.timeout);
                    request.reject(new Error("Worker Python foi encerrado."));
                }

                pendingRequests.clear();
            }

            console.error(`Worker Python encerrado com código: ${code}`);
        });

        workerProcess.on("error", (error) => {
            clearTimeout(startupTimeout);
            reject(error);
        });
    });
}

function runInference(imagePath) {
    return new Promise((resolve, reject) => {
        if (!workerReady || !workerProcess) {
            reject(new Error("Modelo ainda não está pronto para inferência."));
            return;
        }

        const id = crypto.randomUUID();

        const timeout = setTimeout(() => {
            pendingRequests.delete(id);
            reject(new Error("Timeout durante a inferência."));
        }, 30000);

        pendingRequests.set(id, {
            resolve,
            reject,
            timeout
        });

        workerProcess.stdin.write(JSON.stringify({
            id,
            imagePath
        }) + os.EOL);
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname || "").toLowerCase();
        const safeExtension = extension || ".jpg";
        cb(null, `${crypto.randomUUID()}${safeExtension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/bmp"
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            cb(new Error("Formato inválido. Envie uma imagem JPEG, PNG, WEBP ou BMP."));
            return;
        }

        cb(null, true);
    }
});

async function bootstrap() {
    console.log("Inicializando API de inferência CNN...");
    console.log(`Modelo esperado em: ${MODEL_PATH}`);

    validateModelFile();

    try {
        await startPythonWorker();
    } catch (error) {
        console.error("\nNão foi possível iniciar a API.");
        console.error(error.message);
        process.exit(1);
    }

    const app = express();

    const cors = require("cors");
    app.use(cors());

    app.post("/infer", upload.single("image"), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                error: "Nenhuma imagem foi enviada. Use o campo multipart chamado 'image'."
            });
        }

        const imagePath = req.file.path;

        try {
            const result = await runInference(imagePath);

            return res.json({
                ok: true,
                ...result
            });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                error: error.message
            });

        } finally {
            fs.unlink(imagePath, () => { });
        }
    });

    app.use((error, req, res, next) => {
        return res.status(400).json({
            ok: false,
            error: error.message
        });
    });

    app.listen(PORT, () => {
        console.log(`\nServidor rodando em: http://localhost:${PORT}`);
        console.log(`Endpoint de inferência: POST http://localhost:${PORT}/infer`);
        console.log("\nCampo esperado no multipart/form-data:");
        console.log("image");
    });
}

bootstrap();