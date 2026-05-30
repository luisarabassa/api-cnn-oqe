# API de Inferência CNN com Node.js + PyTorch

Esta API recebe uma imagem, executa a inferência em um modelo CNN treinado no PyTorch e retorna a classe prevista pelo modelo.

A API foi construída em Node.js, mas a inferência é executada com PyTorch em Python, pois o modelo salvo está no formato `.pth`.

---

## Estrutura esperada do projeto

```txt
cnn-node-api/
├── server.js
├── package.json
├── requirements.txt
└── models_saved/
    └── model.pth
```

---

## 1. Instalar dependências do Node.js

Dentro da pasta do projeto, execute:

```bash
npm install
```

---

## 2. Criar ambiente Python

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

---

## 3. Instalar dependências Python

Com o ambiente Python ativado, execute:

```bash
pip install -r requirements.txt
```

---

## 4. Copiar o modelo treinado

Após treinar sua CNN, você terá um arquivo `.pth`, por exemplo:

```txt
model_20260522_103012.pth
```

Copie esse arquivo para a pasta:

```txt
models_saved/
```

E renomeie obrigatoriamente para:

```txt
model.pth
```

O caminho final deve ficar assim:

```txt
models_saved/model.pth
```

Atenção: se o arquivo `models_saved/model.pth` não existir, a API não inicia.

---

## 5. Rodar a API

Execute:

```bash
npm start
```

Se tudo estiver correto, a API irá carregar o modelo `.pth` e ficará aguardando requisições.

Exemplo de saída esperada:

```txt
Inicializando API de inferência CNN...
Modelo esperado em: models_saved/model.pth

API iniciada com modelo carregado.
Servidor rodando em: http://localhost:3000
Endpoint de inferência: POST http://localhost:3000/infer
```

---

## 6. Endpoint disponível

A API possui apenas um endpoint:

```txt
POST /infer
```

Esse endpoint recebe uma imagem no formato `multipart/form-data`.

O nome do campo da imagem deve ser:

```txt
image
```

---

## 7. Testar com curl

Coloque uma imagem de teste na pasta do projeto, por exemplo (teste.jpg, teste.png, qualquer outro):

```txt
teste.jpg
```

Depois execute em outro terminal em sua máquina:

```bash
curl -X POST http://localhost:3000/infer \
  -F "image=@./teste.jpg"
```

No Windows PowerShell, use:

```powershell
curl.exe -X POST http://localhost:3000/infer -F "image=@./teste.jpg"
```

---

## 8. Resposta esperada

A API retorna um JSON com a classe prevista pelo modelo:

```json
{
  "ok": true,
  "predictedClass": "cat",
  "predictedIndex": 0,
  "confidence": 0.9231,
  "topPredictions": [
    {
      "class": "cat",
      "index": 0,
      "confidence": 0.9231
    },
    {
      "class": "dog",
      "index": 1,
      "confidence": 0.0612
    },
    {
      "class": "horse",
      "index": 2,
      "confidence": 0.0157
    }
  ]
}
```

---

## 9. Observações importantes

A arquitetura da CNN usada na API precisa ser igual à arquitetura usada no treinamento.

Se você alterou a classe `CNN` durante o treinamento, também precisa atualizar a classe `CNN` dentro do arquivo `server.js`.

O arquivo `.pth` deve ter sido salvo no formato utilizado no código da aula.

---

## 10. Checklist antes de rodar

Antes de executar `npm start`, confirme:

- O Node.js está instalado.
- O Python está instalado.
- As dependências do Node foram instaladas com `npm install`.
- As dependências Python foram instaladas com `pip install -r requirements.txt`.
- A pasta `models_saved/` existe.
- O modelo treinado foi copiado para `models_saved/model.pth`.
- O nome do arquivo é exatamente `model.pth`.
- A arquitetura da CNN na API é igual à arquitetura usada no treinamento.

---

## Comando final para rodar

```bash
npm start
```