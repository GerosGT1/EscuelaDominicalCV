import { useState, useEffect, useCallback } from 'react'
import { X, Download, Printer, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { LessonImage } from '@/types/database'
import toast from 'react-hot-toast'

interface ImageLightboxModalProps {
  images: LessonImage[]
  initialIndex?: number
  lessonTitle?: string
  biblicalText?: string
  onClose: () => void
}

export function ImageLightboxModal({
  images,
  initialIndex = 0,
  lessonTitle = 'Lección de Escuela Dominical',
  biblicalText,
  onClose,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const currentImage = images[currentIndex]

  const handlePrev = useCallback(() => {
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // Manejo de teclado (Escape, Flecha Izquierda, Flecha Derecha)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        handlePrev()
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, onClose, images.length])

  // Evitar scroll del body mientras el modal está abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Función de descarga directa
  const handleDownload = async () => {
    if (!currentImage?.url) return
    setIsDownloading(true)
    const toastId = toast.loading('Preparando descarga...')

    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      const extension = currentImage.url.split('.').pop()?.split('?')[0] || 'jpg'
      const cleanTitle = (currentImage.title || lessonTitle)
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .slice(0, 40)
      link.download = `ilustracion_${cleanTitle}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast.success('¡Imagen descargada exitosamente!', { id: toastId })
    } catch {
      // Fallback seguro si hay bloqueo CORS
      const link = document.createElement('a')
      link.href = currentImage.url
      link.target = '_blank'
      link.download = `ilustracion.jpg`
      link.click()
      toast.success('Abriendo imagen para descargar...', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // Función para imprimir lámina optimizada para clase / colorear
  const handlePrint = () => {
    if (!currentImage?.url) return

    const printWindow = window.open('', '_blank', 'width=900,height=800')
    if (!printWindow) {
      toast.error('Por favor permite las ventanas emergentes para imprimir')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Imprimir Ilustración - ${currentImage.title || lessonTitle}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 1.5cm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              min-height: 95vh;
            }
            .header {
              text-align: center;
              width: 100%;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .church {
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #1e3a8a;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 4px 0;
            }
            .bible-verse {
              font-size: 14px;
              color: #b45309;
              font-style: italic;
              font-weight: 600;
            }
            .image-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              max-height: 70vh;
            }
            img {
              max-width: 100%;
              max-height: 65vh;
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
            }
            .caption {
              margin-top: 10px;
              font-size: 15px;
              font-weight: 600;
              color: #334155;
            }
            .desc {
              margin-top: 4px;
              font-size: 13px;
              color: #64748b;
              max-width: 80%;
              text-align: center;
            }
            .footer {
              width: 100%;
              border-top: 1px dashed #94a3b8;
              padding-top: 14px;
              margin-top: 16px;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: #475569;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church">Asambleas de Dios · Auditorium Cristo Viene</div>
            <div class="title">${lessonTitle}</div>
            ${biblicalText ? `<div class="bible-verse">«${biblicalText}»</div>` : ''}
          </div>

          <div class="image-container">
            <img src="${currentImage.url}" alt="${currentImage.title || 'Ilustración'}" onload="window.focus(); window.print();" />
            ${currentImage.title ? `<div class="caption">${currentImage.title}</div>` : ''}
            ${currentImage.description ? `<div class="desc">${currentImage.description}</div>` : ''}
          </div>

          <div class="footer">
            <div><strong>Alumno:</strong> ____________________________________</div>
            <div><strong>Fecha:</strong> _______________</div>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  if (!currentImage) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Barra superior con controles y acciones */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
            {currentIndex + 1} / {images.length}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold truncate text-white">
              {currentImage.title || `Ilustración ${currentIndex + 1}`}
            </h3>
            <p className="text-xs text-neutral-300 truncate hidden sm:block">
              {lessonTitle}
            </p>
          </div>
        </div>

        {/* Acciones principales: Imprimir, Descargar, Cerrar */}
        <div className="flex items-center gap-2">
          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition-colors"
            title="Imprimir ilustración en hoja de trabajo"
          >
            <Printer className="w-4 h-4 text-gold-300" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Botón Descargar */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            title="Descargar ilustración en alta resolución"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Descargar</span>
          </button>

          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
            title="Cerrar visor (Esc)"
            aria-label="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área principal del visor de imagen */}
      <div
        className="flex-1 flex items-center justify-center p-4 relative min-h-0 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Navegación anterior */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-3 sm:left-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-110 active:scale-95"
            aria-label="Ilustración anterior"
            title="Anterior (Flecha izquierda)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Imagen centrada y contenedor */}
        <div
          className="relative max-w-5xl max-h-full flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
            </div>
          )}

          <img
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.title || 'Ilustración bíblica'}
            onLoad={() => setImageLoaded(true)}
            className={`max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Pie de foto / descripción */}
          {currentImage.description && (
            <div className="mt-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-center max-w-xl">
              <p className="text-xs sm:text-sm text-neutral-200">
                {currentImage.description}
              </p>
            </div>
          )}
        </div>

        {/* Navegación siguiente */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-3 sm:right-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-110 active:scale-95"
            aria-label="Ilustración siguiente"
            title="Siguiente (Flecha derecha)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Carrusel inferior de miniaturas si hay más de 1 imagen */}
      {images.length > 1 && (
        <div
          className="w-full py-3 px-4 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => {
                setImageLoaded(false)
                setCurrentIndex(idx)
              }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === currentIndex
                  ? 'border-gold-400 scale-105 shadow-md shadow-gold-500/20'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="w-12 h-12 sm:w-14 sm:h-14 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
