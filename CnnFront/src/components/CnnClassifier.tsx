import React, { useState, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface TopPrediction {
  class: string;
  index: number;
  confidence: number;
}

interface InferenceResult {
  ok: boolean;
  predictedClass: string;
  predictedIndex: number;
  confidence: number;
  topPredictions: TopPrediction[];
}

export default function CnnClassifier() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato inválido. Use JPEG, PNG, WEBP ou BMP.');
      return;
    }

    setError(null);
    setResult(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('http://localhost:3000/infer', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao processar a imagem.');
      }

      setResult(data as InferenceResult);
    } catch (err: any) {
      setError(err.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview); 
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="px-20 py-15 bg-brand-cream text-brand-coffee rounded-2xl font-serif">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-brand-burgundy font-etna">
          Classificador de Imagens CNN
        </h1>
        <p className="mt-2 text-2xl">
          Envie uma imagem para receber a predição da rede neural em tempo real.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col justify-between h-100 w-80">
          {!preview ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center border-2 rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? 'border-brand-coffee bg-brand-cream ' 
                  : 'border-brand-coffee hover:bg-brand-burgundy bg-brand-coffee hover:text-brand-burgundy'}`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleInputChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <svg className="w-13 h-13 text-brand-cream mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg text-brand-cream ">
                  Arraste uma imagem ou <span className="text-red-100 underline">clique aqui</span>
                </span>
                <span className="text-md text-red-100 mt-1">PNG, JPG, WEBP ou BMP até 8MB</span>
              </label>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-brand-cream border border-brand-coffee rounded-xl p-4 items-center justify-center relative group ">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg shadow-md"
              />
              {!loading && (
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 bg-brand-burgundy hover:bg-brand-coffee text-brand-cream p-1.5 rounded-full transition-colors  cursor-pointer"
                  title="Remover imagem"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {preview && !result && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full mt-4 py-3 px-4 rounded-xl font-etna text-lg tracking-wide transition-all duration-200 cursor-pointer
                ${loading 
                  ? 'bg-brand-coffee text-brand-cream cursor-not-allowed' 
                  : 'bg-brand-burgundy hover:bg-brand-coffee text-brand-cream'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-brand-cream" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando via Redes Neurais...
                </span>
              ) : (
                'Classificar Imagem'
              )}
            </button>
          )}
        </div>


        <div className="flex flex-col bg-brand-cream border border-brand-coffee rounded-xl p-6">
          <h2 className="text-xl brand-coffee font-etna border-b tracking-wide border-brand-coffee pb-2 mb-4">
            Painel de Análise
          </h2>

          {!loading && !result && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-brand-burgundy text-md">
              Aguardando envio da imagem...
            </div>
          )}

          {loading && (
            <div className="flex-1 space-y-4 animate-pulse">
              <div className="h-4 bg-brand-burgundy rounded w-3/4"></div>
              <div className="h-10 bg-brand-burgundy rounded-xl w-full mt-2"></div>
              <div className="space-y-3 mt-6">
                <div className="h-3 bg-brand-burgundy rounded w-full"></div>
                <div className="h-3 bg-brand-burgundy rounded w-5/6"></div>
                <div className="h-3 bg-brand-burgundy rounded w-2/3"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center p-4 bg-brand-burgundy/10 border border-brand-burgundy/20 text-brand-burgundy rounded-xl text-sm gap-3 self-start w-full">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="bg-brand-cream p-4 rounded-xl border border-brand-coffee mb-6 shadow-inner">
                <span className="text-md text-brand-coffee">Classe Predita</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-2xl font-bold text-brand-burgundy font-etna tracking-wide capitalize">
                    {result.predictedClass}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-md text-brand-coffee font-medium">Confiança geral:</span>
                  <span className="text-md font-bold text-brand-burgundy">{(result.confidence * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold tracking-wide text-brand-coffee mb-3">
                  Ranking de Probabilidades
                </h3>
                <div className="space-y-3">
                  {result.topPredictions?.map((pred, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-brand-coffee capitalize">{pred.class}</span>
                        <span className="text-brand-burgundy font-mono">{(pred.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-brand-cream border-1 b-brand-coffee h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            idx === 0 ? 'bg-brand-burgundy' : 'bg-brand-coffee'
                          }`}
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mt-6 text-md text-brand-burgundy hover:text-brand-coffee self-end flex items-center gap-1 cursor-pointer"
              >
                Nova análise
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}