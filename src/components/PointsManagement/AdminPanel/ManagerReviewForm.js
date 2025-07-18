import React, { useState, useEffect } from 'react';
import { Save, Edit, CheckCircle, XCircle, Star, FileText, Download } from 'lucide-react';
import NotificationToast from '../shared/NotificationToast';
import { pointsAPI } from '../../../services/pointsAPI';

const ManagerReviewForm = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [managerScore, setManagerScore] = useState({});
  const [reviewComments, setReviewComments] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      console.log('載入待審核的積分提交記錄');

      // 使用真實API獲取待審核記錄
      const response = await pointsAPI.getPendingEntries();
      console.log('獲取待審核記錄成功:', response);

      // 檢查響應格式並獲取數據
      const pendingData = response.data || response;
      console.log('處理後的待審核數據:', pendingData);

      // 轉換API數據格式以符合組件需求
      const transformedSubmissions = Array.isArray(pendingData) ? pendingData.map(entry => ({
        id: entry.id,
        employeeId: entry.employeeId,
        employeeName: entry.employeeName || '未知員工',
        department: entry.department || '未知部門',
        submissionDate: entry.submittedAt || entry.createdAt,
        totalPoints: entry.pointsCalculated || 0,
        status: entry.status || 'pending',
        standardName: entry.standardName || '未知項目',
        description: entry.description || '',
        basePoints: entry.basePoints || 0,
        bonusPoints: entry.bonusPoints || 0,
        evidenceFiles: entry.evidenceFiles || null
      })) : [];

      console.log('轉換後的提交記錄:', transformedSubmissions);
      setSubmissions(transformedSubmissions);
    } catch (error) {
      console.error('載入提交記錄失敗:', error);
      // API失敗時顯示空列表
      setSubmissions([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setManagerScore({});
    setReviewComments('');
    setEditMode(false);
  };

  const handleScoreChange = (itemId, score) => {
    setManagerScore(prev => ({
      ...prev,
      [itemId]: score
    }));
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      console.log('核准積分記錄:', selectedSubmission.id);

      // 調用真實API核准積分記錄
      await pointsAPI.approvePointsEntry(
        selectedSubmission.id,
        currentUser.id,
        reviewComments || '審核通過'
      );

      console.log('積分記錄審核通過');
      showNotification('積分提交已核准！', 'success');

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsApproved', {
        detail: {
          entryId: selectedSubmission.id,
          employeeId: selectedSubmission.employeeId,
          approverId: currentUser.id
        }
      }));

      // 重新載入列表
      await loadSubmissions();
      setSelectedSubmission(null);
      setReviewComments('');
      setManagerScore({});
    } catch (error) {
      console.error('核准失敗:', error);
      showNotification('核准失敗：' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewComments.trim()) {
      showNotification('請填寫拒絕原因', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('拒絕積分記錄:', selectedSubmission.id);

      // 調用真實API拒絕積分記錄
      await pointsAPI.rejectPointsEntry(
        selectedSubmission.id,
        currentUser.id,
        reviewComments
      );

      console.log('積分記錄已拒絕');
      showNotification('積分提交已拒絕', 'info');

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsRejected', {
        detail: {
          entryId: selectedSubmission.id,
          employeeId: selectedSubmission.employeeId,
          rejectedBy: currentUser.id,
          reason: reviewComments
        }
      }));

      // 重新載入列表
      await loadSubmissions();
      setSelectedSubmission(null);
      setReviewComments('');
      setManagerScore({});
    } catch (error) {
      console.error('拒絕失敗:', error);
      showNotification('拒絕失敗：' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileName, fileId = null) => {
    try {
      showNotification(`正在下載檔案: ${fileName}`, 'info');

      if (fileId) {
        // 如果有檔案ID，使用真實的下載API
        const response = await pointsAPI.downloadFile(fileId);

        // 創建下載連結
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        showNotification(`檔案下載成功: ${fileName}`, 'success');
      } else {
        // 暫時的模擬下載
        showNotification(`檔案下載功能開發中: ${fileName}`, 'info');
      }
    } catch (error) {
      console.error('下載檔案失敗:', error);
      showNotification('下載檔案失敗', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-transparent">
      <h2 className="text-2xl font-bold text-white">👨‍💼 主管審核與評分</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：待審核列表 */}
        <div className="lg:col-span-1">
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📋 待審核提交</h3>
            
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                <p>目前沒有待審核的提交</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => handleSelectSubmission(submission)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSubmission?.id === submission.id
                        ? 'border-blue-400 bg-slate-600/50'
                        : 'border-slate-500/50 bg-slate-700/30 hover:bg-slate-600/30'
                    }`}
                  >
                    <div className="font-medium text-white">{submission.employeeName}</div>
                    <div className="text-sm text-slate-300">{submission.department}</div>
                    <div className="text-sm text-blue-300 font-medium mt-1">
                      {submission.totalPoints.toFixed(1)} 積分
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(submission.submissionDate).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右側：審核詳情 */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedSubmission.employeeName} 的積分提交
                  </h3>
                  <p className="text-slate-300">
                    {selectedSubmission.department} • 
                    {new Date(selectedSubmission.submissionDate).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">
                    {selectedSubmission.totalPoints.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-400">員工計算積分</div>
                </div>
              </div>

              {/* 積分項目詳情 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">📝 積分項目詳情</h4>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{editMode ? '完成編輯' : '編輯評分'}</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{selectedSubmission.standardName}</h5>
                      <p className="text-sm text-gray-600 mt-1">{selectedSubmission.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-blue-600 font-medium">
                        {selectedSubmission.totalPoints?.toFixed(1)} 積分
                      </div>
                      <div className="text-xs text-gray-500">
                        基礎: {selectedSubmission.basePoints?.toFixed(1)}
                        {selectedSubmission.bonusPoints > 0 && (
                          <span className="text-green-600 ml-1">
                            +{selectedSubmission.bonusPoints?.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 主管評分 */}
                  {editMode && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        主管評分 (0-5星):
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleScoreChange('main', star)}
                            className={`p-1 ${
                              (managerScore['main'] || 0) >= star
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {managerScore['main'] || 0} 星
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 證明文件 */}
                  {selectedSubmission.evidenceFiles && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">證明文件:</h6>
                      <div className="space-y-1">
                        {(() => {
                          try {
                            const files = typeof selectedSubmission.evidenceFiles === 'string'
                              ? JSON.parse(selectedSubmission.evidenceFiles)
                              : selectedSubmission.evidenceFiles;

                            if (Array.isArray(files)) {
                              return files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                                  <span>{file.name || file.fileName || `檔案${index + 1}`}</span>
                                  <button
                                    onClick={() => downloadFile(file.name || file.fileName || `檔案${index + 1}`)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>下載</span>
                                  </button>
                                </div>
                              ));
                            } else {
                              return <div className="text-sm text-gray-500">無檔案資料</div>;
                            }
                          } catch (error) {
                            console.error('解析檔案資料失敗:', error);
                            return <div className="text-sm text-gray-500">檔案資料格式錯誤</div>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 審核意見 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  審核意見:
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="請填寫審核意見、建議或拒絕原因..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 審核按鈕 */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>拒絕</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>處理中...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>核准</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">選擇要審核的提交</h3>
              <p className="text-gray-600">請從左側列表選擇一個待審核的積分提交</p>
            </div>
          )}
        </div>
      </div>

      {/* 通知組件 */}
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />
    </div>
  );
};

export default ManagerReviewForm;
