import React, { useState, useEffect } from 'react';
import { Plus, Upload, X, Calculator, Save, Eye, CheckCircle, XCircle } from 'lucide-react';
import { pointsConfig, pointsUtils } from '../../../config/pointsConfig';
import { pointsCalculator } from '../../../utils/pointsCalculations';

const PointsEntryForm = ({ currentUser }) => {
  const [selectedType, setSelectedType] = useState('general');
  const [standards, setStandards] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [formData, setFormData] = useState({
    standardId: '',
    inputValue: 1,
    description: '',
    evidenceFiles: []
  });
  const [calculationPreview, setCalculationPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadStandards();
  }, [selectedType, currentUser.departmentId]);

  useEffect(() => {
    if (selectedStandard) {
      calculatePreview();
    }
  }, [selectedStandard, formData.inputValue, formData.description, formData.evidenceFiles]);

  // 通知函數
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadStandards = async () => {
    try {
      // 這裡應該調用 API 獲取評分標準
      // 暫時使用模擬數據
      const mockStandards = {
        general: [
          { id: 1, categoryName: '定時巡機檢驗', pointsValue: 8, inputType: 'checkbox', description: '每兩小時/次，每月8積分' },
          { id: 2, categoryName: '工具回收歸位', pointsValue: 0.3, inputType: 'number', description: '0.3積分/台' },
          { id: 3, categoryName: '工作日誌', pointsValue: 0.1, inputType: 'number', description: '0.1積分/天' },
          { id: 4, categoryName: '提出改善方案', pointsValue: 0.4, inputType: 'number', description: '0.4積分/案' }
        ],
        professional: [
          { id: 5, categoryName: 'CNC改機', pointsValue: 2.5, inputType: 'checkbox', description: '微調1，有改過2.5，首次4積分' },
          { id: 6, categoryName: 'CNC編碼', pointsValue: 1, inputType: 'checkbox', description: '微調0.5，有改過1，首次4積分' },
          { id: 7, categoryName: '首件檢驗', pointsValue: 3, inputType: 'number', description: '3積分/單（3日以上）' }
        ],
        management: [
          { id: 8, categoryName: '下屬工作日誌', pointsValue: 0.5, inputType: 'number', description: '0.5積分/人/週' },
          { id: 9, categoryName: '教育訓練', pointsValue: 3, inputType: 'number', description: '3積分/2小時' },
          { id: 10, categoryName: '幹部會議', pointsValue: 1, inputType: 'checkbox', description: '1積分/次' }
        ],
        core: [
          { id: 11, categoryName: '誠信正直', pointsValue: 5, inputType: 'checkbox', description: '工作異常改善單1積分/份' },
          { id: 12, categoryName: '創新效率', pointsValue: 5, inputType: 'checkbox', description: '超過標準積分110%=5積分' },
          { id: 13, categoryName: '卓越品質', pointsValue: 5, inputType: 'checkbox', description: '不良率低於1%=5積分' }
        ]
      };

      setStandards(mockStandards[selectedType] || []);
    } catch (error) {
      console.error('載入評分標準失敗:', error);
    }
  };

  const calculatePreview = () => {
    if (!selectedStandard) return;

    const result = pointsCalculator.calculateFinalPoints(
      selectedStandard,
      formData.inputValue,
      formData.description,
      formData.evidenceFiles
    );

    setCalculationPreview(result);
  };

  const handleStandardSelect = (standard) => {
    setSelectedStandard(standard);
    setFormData(prev => ({
      ...prev,
      standardId: standard.id,
      inputValue: standard.inputType === 'checkbox' ? 1 : 1
    }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        // 驗證檔案
        const validation = pointsUtils.validateFile(file);
        if (!validation.isValid) {
          showNotification(`檔案 ${file.name} 驗證失敗: ${validation.errors.join(', ')}`, 'error');
          continue;
        }

        // 這裡應該調用檔案上傳 API
        // 暫時模擬上傳成功
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file) // 實際應該是伺服器返回的 URL
        });
      }

      setFormData(prev => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...uploadedFiles]
      }));
    } catch (error) {
      console.error('檔案上傳失敗:', error);
      showNotification('檔案上傳失敗，請重試', 'error');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStandard) {
      showNotification('請選擇積分項目', 'error');
      return;
    }

    setLoading(true);
    try {
      const entryData = {
        employeeId: currentUser.id,
        standardId: formData.standardId,
        entryDate: new Date().toISOString(),
        description: formData.description,
        evidenceFiles: formData.evidenceFiles.map(f => f.url)
      };

      // 這裡應該調用 API 提交積分記錄
      console.log('提交積分記錄:', entryData);

      showNotification('積分記錄提交成功！', 'success');

      // 重置表單
      setFormData({
        standardId: '',
        inputValue: 1,
        description: '',
        evidenceFiles: []
      });
      setSelectedStandard(null);
      setCalculationPreview(null);

    } catch (error) {
      console.error('提交失敗:', error);
      showNotification('提交失敗，請重試', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">積分項目填寫</h2>
        <div className="text-sm text-gray-600">
          推廣期倍數: {pointsUtils.getPromotionMultiplier(new Date())}x
        </div>
      </div>

      {/* 使用說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 如何填寫積分</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. 選擇積分類型（一般/專業/管理/核心職能）</p>
          <p>2. 選擇具體的工作項目</p>
          <p>3. 填寫詳細的工作說明</p>
          <p>4. 上傳相關證明文件（可選）</p>
          <p>5. 查看積分計算預覽並提交</p>
        </div>
      </div>

      {/* 積分類型選擇 */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 步驟1：選擇積分類型
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(pointsConfig.pointsTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: config.color }}
                ></div>
                <div className="font-medium text-sm">{config.name}</div>
                <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                {selectedType === type && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">✓ 已選擇</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 積分項目選擇 */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📝 步驟2：選擇具體積分項目
          {selectedType && (
            <span className="ml-2 text-sm text-green-600">
              ({pointsConfig.pointsTypes[selectedType]?.name})
            </span>
          )}
        </h3>

        {standards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👆</div>
            <p>請先選擇積分類型</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standards.map((standard) => (
              <button
                key={standard.id}
                onClick={() => handleStandardSelect(standard)}
                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedStandard?.id === standard.id
                    ? 'border-green-500 bg-green-50 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{standard.categoryName}</div>
                <div className="text-sm text-gray-600 mt-1">{standard.description}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm font-medium text-blue-600">
                    基礎積分: {pointsUtils.formatPoints(standard.pointsValue)}
                  </div>
                  {selectedStandard?.id === standard.id && (
                    <div className="text-xs text-green-600 font-medium">✓ 已選擇</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 填寫表單 */}
      {selectedStandard && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-6 space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ✍️ 步驟3：填寫工作內容
            </h3>
            <div className="mt-2 p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-800">
                <strong>選擇的項目：</strong>{selectedStandard.categoryName}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {selectedStandard.description}
              </div>
            </div>
          </div>

          {/* 數值輸入 */}
          {selectedStandard.inputType === 'number' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                數量/次數
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.inputValue}
                onChange={(e) => setFormData(prev => ({ ...prev, inputValue: parseFloat(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 工作說明 */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 詳細工作說明 <span className="text-red-500">*</span>
            </label>
            <div className="text-xs text-yellow-700 mb-2">
              💡 提示：詳細的工作說明有助於獲得更好的評分，建議至少50字
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              placeholder="請詳細描述：&#10;1. 具體執行了什麼工作&#10;2. 工作的完成情況如何&#10;3. 遇到什麼問題及如何解決&#10;4. 工作成果或效益&#10;&#10;例如：完成CNC-01機台的定時巡檢工作，檢查機台運行狀況，發現並處理了..."
              className="w-full border-2 border-yellow-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 min-h-[120px]"
              required
            />
            <div className="mt-2 text-xs text-gray-500">
              目前字數: {formData.description.length} 字
              {formData.description.length < 20 && (
                <span className="text-red-500 ml-2">建議至少20字以獲得更好評分</span>
              )}
            </div>
          </div>

          {/* 檔案上傳 */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 證明文件上傳 (可選，但建議上傳)
            </label>
            <div className="text-xs text-green-700 mb-3">
              💡 上傳相關證明文件可獲得額外獎勵分數！
            </div>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-white hover:bg-green-25 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-green-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-green-700 hover:text-green-800">
                      {uploadingFiles ? '上傳中...' : '點擊選擇檔案或拖拽到此處'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFiles}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    支援格式：JPG, PNG, PDF, DOCX, XLSX | 單檔最大 10MB | 最多 5 個檔案
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    建議上傳：工作照片、報告文件、檢驗記錄等
                  </p>
                </div>
              </div>
            </div>

            {/* 已上傳檔案列表 */}
            {formData.evidenceFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 積分預覽 */}
          {calculationPreview && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-blue-600" />
                <h4 className="font-bold text-blue-900 text-lg">🎯 積分計算預覽</h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500">基礎積分</div>
                    <div className="text-lg font-bold text-gray-900">
                      {pointsUtils.formatPoints(calculationPreview.basePoints)}
                    </div>
                  </div>

                  {calculationPreview.bonusPoints > 0 && (
                    <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600">獎勵積分</div>
                      <div className="text-lg font-bold text-green-700">
                        +{pointsUtils.formatPoints(calculationPreview.bonusPoints)}
                      </div>
                    </div>
                  )}

                  {calculationPreview.penaltyPoints > 0 && (
                    <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                      <div className="text-xs text-red-600">懲罰積分</div>
                      <div className="text-lg font-bold text-red-700">
                        -{pointsUtils.formatPoints(calculationPreview.penaltyPoints)}
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                    <div className="text-xs text-yellow-600">推廣倍數</div>
                    <div className="text-lg font-bold text-yellow-700">
                      {calculationPreview.promotionMultiplier}x
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg border-2 border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-900">🏆 最終積分:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {pointsUtils.formatPoints(calculationPreview.finalPoints)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 計算說明 */}
              <div className="mt-3 text-xs text-blue-700">
                {calculationPreview.calculationDetails}
              </div>

              {/* 獎懲原因 */}
              {(calculationPreview.bonusReasons.length > 0 || calculationPreview.penaltyReasons.length > 0) && (
                <div className="mt-3 space-y-1">
                  {calculationPreview.bonusReasons.map((reason, index) => (
                    <div key={index} className="text-xs text-green-700">✓ {reason}</div>
                  ))}
                  {calculationPreview.penaltyReasons.map((reason, index) => (
                    <div key={index} className="text-xs text-red-700">✗ {reason}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 提交按鈕 */}
          <div className="bg-gray-50 p-4 rounded-lg border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>📋 檢查清單:</span>
                  <span className={formData.description.length >= 20 ? 'text-green-600' : 'text-red-600'}>
                    {formData.description.length >= 20 ? '✓' : '✗'} 工作說明充足
                  </span>
                  <span className={calculationPreview ? 'text-green-600' : 'text-gray-400'}>
                    {calculationPreview ? '✓' : '○'} 積分計算完成
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStandard(null);
                    setFormData({ standardId: '', inputValue: 1, description: '', evidenceFiles: [] });
                    setCalculationPreview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.description.trim() || formData.description.length < 10}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>提交中...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>🚀 提交積分申請</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {(!formData.description.trim() || formData.description.length < 10) && (
              <div className="mt-2 text-xs text-red-600">
                ⚠️ 請填寫至少10字的工作說明才能提交
              </div>
            )}
          </div>
        </form>
      )}

      {/* 通知組件 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsEntryForm;
