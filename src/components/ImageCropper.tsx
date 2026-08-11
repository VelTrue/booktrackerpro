import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

interface ImageCropperProps {
  imageSrc: string
  aspect: number
  onCancel: () => void
  onConfirm: (croppedDataUrl: string) => void
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}

function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 600,
): Promise<string> {
  return createImage(imageSrc).then((image) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return imageSrc
    }

    const scaleX = image.naturalWidth / (image.width || 1)
    const scaleY = image.naturalHeight / (image.height || 1)

    const cropX = pixelCrop.x * scaleX
    const cropY = pixelCrop.y * scaleY
    const cropWidth = pixelCrop.width * scaleX
    const cropHeight = pixelCrop.height * scaleY

    const ratio = outputSize / cropWidth

    canvas.width = cropWidth * ratio
    canvas.height = cropHeight * ratio

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    return canvas.toDataURL('image/jpeg', 0.85)
  })
}

export function ImageCropper({ imageSrc, aspect, onCancel, onConfirm }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    [],
  )

  function handleConfirm() {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    getCroppedImg(imageSrc, croppedAreaPixels)
      .then((dataUrl) => {
        onConfirm(dataUrl)
        setIsProcessing(false)
      })
      .catch(() => {
        setIsProcessing(false)
        onCancel()
      })
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden modal-enter">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Обрезка обложки</h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="relative h-80 w-full bg-slate-900"
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-5 py-3">
          <span className="text-sm text-slate-500">Масштаб</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn-primary flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Обработка...' : 'Обрезать'}
          </button>
        </div>
      </div>
    </div>
  )
}
