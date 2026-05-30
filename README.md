# Classificador de Roupas OQE

Aplicação web para classificação de imagens de roupas usando uma CNN treinada com PyTorch. O front-end foi construído com React + Vite e se comunica com uma API Node.js que executa a inferência via Python.

---

## Classes suportadas

O modelo classifica imagens nas seguintes categorias:

- Camiseta
- Vestido
- Bolsa
- Casaco
- Tênis
- Sandália

---

## Pré-requisitos

- Node.js instalado
- Python instalado
- Modelo treinado no formato `.pth`

---

## Instalação

### 1. Dependências do Node.js

```bash
npm install
```

---

### 2. Ambiente Python

**Linux/macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows PowerShell:**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

---

### 3. Dependências Python

Com o ambiente virtual ativado:

```bash
pip install -r requirements.txt
```

---

## Rodando a aplicação

### API (back-end)

Com o ambiente Python ativado:

```bash
npm start
```

Saída esperada:

```
Inicializando API de inferência CNN...
Modelo esperado em: models_saved/model.pth

API iniciada com modelo carregado.
Servidor rodando em: http://localhost:3000
Endpoint de inferência: POST http://localhost:3000/infer
```

### Front-end

Em outro terminal:

```bash
npm run dev
```

Acesse o endereço exibido pelo Vite, geralmente `http://localhost:5173`.

---

## Como usar

1. Abra a aplicação no navegador
2. Escolha ou cole uma imagem de roupa (JPG, PNG, WEBP ou BMP)
3. Clique em **Classificar imagem**
4. O resultado aparece com a classe prevista e o nível de confiança
5. Clique em **Nova análise** (canto direito) para classificar outra imagem

---

## Endpoint da API

```
POST /infer
```

Recebe uma imagem via `multipart/form-data` no campo `image`.

**Exemplo com curl:**

```bash
curl -X POST http://localhost:3000/infer \
  -F "image=@./imagem-teste.jpg"
```

**Windows PowerShell:**

```powershell
curl.exe -X POST http://localhost:3000/infer -F "image=@./imagem-teste.jpg"
```

**Resposta:**

```json
{
  "ok": true,
  "predictedClass": "camiseta",
  "predictedIndex": 0,
  "confidence": 0.9231,
  "topPredictions": [
    { "class": "camiseta", "index": 0, "confidence": 0.9231 },
    { "class": "vestido",  "index": 1, "confidence": 0.0612 },
    { "class": "casaco",   "index": 2, "confidence": 0.0157 }
  ]
}
```
