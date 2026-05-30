# Classificador de Roupas OQE

Aplicação web para classificação de imagens de roupas usando uma CNN treinada com PyTorch. O front-end foi construído com React + Vite e se comunica com uma API Node.js que executa a inferência via Python.

---

## Classes suportadas

O modelo classifica imagens nas seguintes categorias:

- Bolsa
- Calça
- Camiseta
- Casaco
- Tênis
- Vestido

---

## Pré-requisitos

- Node.js instalado
- Python instalado

---

## Instalação

Em um terminal dentro da pasta **api**, execute:

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

Em outro terminal, dentro da pasta **front**:

```bash
npm install
```

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
