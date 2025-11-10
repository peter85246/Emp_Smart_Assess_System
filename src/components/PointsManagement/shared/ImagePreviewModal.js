import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const ImagePreviewModal = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  fileName, 
  onDownload 
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setImageLoading(true);
      setImageError(false);
    }
  }, [isOpen, imageSrc]);

  // 鍵盤快捷鍵支持
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5)); // 最大放大到5倍
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.1)); // 最小縮小到0.1倍
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // 預設下載邏輯
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = fileName || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* 背景遮罩 - 使用與 AdminPanel 相同的技術 */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
        onClick={onClose}
      />
      
      {/* 模態框容器 */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
        {/* 小視窗樣式的模態框 */}
        <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden border border-slate-600">
          {/* 標題欄 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-slate-600 bg-slate-700/50 gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="text-white font-medium text-sm sm:text-base truncate">
                {fileName || '圖片預覽'}
              </div>
            </div>

            {/* 工具按鈕 */}
            <div className="flex items-center justify-end flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={handleZoomOut}
                className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="縮小 (-)"
              >
                <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <span className="text-slate-300 text-xs sm:text-sm min-w-[40px] sm:min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="放大 (+)"
              >
                <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={handleRotate}
                className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="旋轉 (R)"
              >
                <RotateCw className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={handleResetZoom}
                className="p-2.5 sm:p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="重置 (0)"
              >
                <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={handleDownload}
                className="p-2.5 sm:p-2 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="下載圖片"
              >
                <Download className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="關閉"
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* 圖片內容區域 - 支持滑動和拖拽 */}
          <div
            className="relative bg-slate-900/50 overflow-auto"
            style={{ height: 'calc(90vh - 80px)' }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
              setZoom(newZoom);
            }}
          >
            <div
              className="min-w-full min-h-full flex items-center justify-center p-4"
              style={{
                minWidth: zoom > 1 ? `${zoom * 100}%` : '100%',
                minHeight: zoom > 1 ? `${zoom * 100}%` : '100%'
              }}
            >
              <img
                src={imageSrc}
                alt={fileName || '預覽圖片'}
                className="transition-transform duration-200 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  maxWidth: zoom <= 1 ? '100%' : 'none',
                  maxHeight: zoom <= 1 ? '100%' : 'none',
                  width: zoom > 1 ? 'auto' : 'auto',
                  height: zoom > 1 ? 'auto' : 'auto',
                  display: imageError ? 'none' : 'block'
                }}
                draggable={false}
                onError={(e) => {
                  console.error('圖片加載失敗:', imageSrc);
                  setImageLoading(false);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('圖片載入成功:', imageSrc);
                  setImageLoading(false);
                  setImageError(false);
                }}
              />
            </div>

            {/* 載入提示 - 只在載入時顯示 */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none bg-slate-900/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                  <p className="text-sm">載入中...</p>
                </div>
              </div>
            )}

            {/* 錯誤提示 - 只在載入失敗時顯示 */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none bg-slate-900/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-lg mb-2">圖片載入失敗</p>
                  <p className="text-sm">請檢查圖片是否存在或嘗試重新載入</p>
                </div>
              </div>
            )}

            {/* 滑動提示 */}
            {zoom > 1 && (
              <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-slate-300 text-xs">💡 可以滑動查看圖片</p>
              </div>
            )}

            {/* 快捷鍵提示 - 只在桌面版顯示 */}
            <div className="hidden md:block absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-slate-300 text-xs space-y-1">
                <p>🖱️ 滾輪縮放</p>
                <p>⌨️ +/- 縮放</p>
                <p>⌨️ 0 重置</p>
                <p>⌨️ R 旋轉</p>
                <p>⌨️ ESC 關閉</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ImagePreviewModal; 