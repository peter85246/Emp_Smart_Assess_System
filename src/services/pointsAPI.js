import { API_CONFIG, getApiUrl } from '../config/apiConfig';

// 簡化的積分API服務
export const pointsAPI = {
  // 提交積分記錄
  async submitBatchPoints(data) {
    try {
      // 創建FormData來符合後端要求
      const formData = new FormData();
      
      // 後端期望的字段格式
      formData.append('employeeId', data.employeeId.toString());
      formData.append('submissionDate', data.submissionDate);
      formData.append('status', data.status || 'pending');
      formData.append('totalPoints', data.totalPoints.toString());
      
      // 將items對象轉換為後端期望的數組格式
      const itemsArray = [];
      if (data.items) {
        Object.entries(data.items).forEach(([key, item]) => {
          if (item && (item.checked || item.value > 0)) {
            itemsArray.push({
              description: item.description || item.name || key,
              calculatedPoints: parseFloat(item.calculatedPoints || item.points || 0),
              checked: item.checked,
              value: item.value,
              selectedValue: item.selectedValue
            });
          }
        });
      }
      
      console.log('轉換後的items數組:', itemsArray);
      formData.append('items', JSON.stringify(itemsArray));
      
      // 如果有檔案，添加到FormData
      if (data.files && Object.keys(data.files).length > 0) {
        Object.entries(data.files).forEach(([key, file], index) => {
          if (file instanceof File) {
            formData.append('files', file);
            formData.append('fileKeys', key);
          }
        });
      }

      // 調用正確的API端點
      const response = await fetch(getApiUrl('/points/batch/submit'), {
        method: 'POST',
        body: formData // 不設置Content-Type，讓瀏覽器自動處理
      });

      if (!response.ok) {
        throw new Error(`提交失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('提交積分錯誤:', error);
      throw error;
    }
  },

  // 獲取員工積分記錄
  async getEmployeePoints(employeeId) {
    try {
      const response = await fetch(getApiUrl(`/points/employee/${employeeId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取積分失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取積分錯誤:', error);
      throw error;
    }
  },

  // 獲取待審核記錄
  async getPendingEntries() {
    try {
      const response = await fetch(getApiUrl('/points/pending'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取待審核記錄失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取待審核記錄錯誤:', error);
      throw error;
    }
  },

  // 獲取積分摘要
  async getEmployeePointsSummary(employeeId, month) {
    try {
      const url = month
        ? `/points/summary/${employeeId}?month=${month}`
        : `/points/summary/${employeeId}`;

      const response = await fetch(getApiUrl(url), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取積分摘要失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取積分摘要錯誤:', error);
      throw error;
    }
  },

  // 核准積分記錄
  async approvePointsEntry(entryId, approverId, comments) {
    try {
      const response = await fetch(getApiUrl(`/points/${entryId}/approve`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approverId: approverId,
          comments: comments || '審核通過'
        })
      });

      if (!response.ok) {
        throw new Error(`核准積分記錄失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('核准積分記錄錯誤:', error);
      throw error;
    }
  },

  // 拒絕積分記錄
  async rejectPointsEntry(entryId, rejectedBy, reason) {
    try {
      const response = await fetch(getApiUrl(`/points/${entryId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectedBy: rejectedBy,
          reason: reason || '不符合標準'
        })
      });

      if (!response.ok) {
        throw new Error(`拒絕積分記錄失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('拒絕積分記錄錯誤:', error);
      throw error;
    }
  }
};

// 簡化的工作日誌API服務
export const workLogAPI = {
  // 創建工作日誌
  async createWorkLog(data) {
    try {
      console.log('創建工作日誌API調用:', {
        url: getApiUrl('/worklog'),
        data: data
      });

      const response = await fetch(getApiUrl('/worklog'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('創建工作日誌失敗響應:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });

        // 嘗試解析錯誤詳情
        try {
          const errorDetails = JSON.parse(errorText);
          console.error('詳細錯誤信息:', errorDetails);
          if (errorDetails.errors) {
            console.error('驗證錯誤:', errorDetails.errors);
          }
        } catch (parseError) {
          console.error('無法解析錯誤響應:', parseError);
        }

        throw new Error(`創建工作日誌失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('創建工作日誌成功響應:', result);
      return result;
    } catch (error) {
      console.error('創建工作日誌錯誤:', error);
      throw error;
    }
  },

  // 更新工作日誌
  async updateWorkLog(id, data) {
    try {
      console.log('更新工作日誌API調用:', {
        id: id,
        url: getApiUrl(`/worklog/${id}`),
        data: data
      });

      const response = await fetch(getApiUrl(`/worklog/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('更新工作日誌失敗響應:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });

        // 嘗試解析錯誤詳情
        try {
          const errorDetails = JSON.parse(errorText);
          console.error('詳細錯誤信息:', errorDetails);
          if (errorDetails.errors) {
            console.error('驗證錯誤:', errorDetails.errors);
          }
        } catch (parseError) {
          console.error('無法解析錯誤響應:', parseError);
        }

        throw new Error(`更新工作日誌失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('更新工作日誌成功響應:', result);
      return result;
    } catch (error) {
      console.error('更新工作日誌錯誤:', error);
      throw error;
    }
  },

  // 刪除工作日誌
  async deleteWorkLog(id) {
    try {
      const response = await fetch(getApiUrl(`/worklog/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`刪除工作日誌失敗: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('刪除工作日誌錯誤:', error);
      throw error;
    }
  },

  // 獲取員工工作日誌
  async getEmployeeWorkLogs(employeeId) {
    try {
      const response = await fetch(getApiUrl(`/worklog/employee/${employeeId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取工作日誌失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取工作日誌錯誤:', error);
      throw error;
    }
  }
};

// 簡化的檔案上傳API服務
export const fileUploadAPI = {
  // 上傳檔案 - 修復參數匹配後端期望
  async uploadFile(file, entityType = 'WorkLog', entityId = 0, uploadedBy = 1) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId.toString());
      formData.append('uploadedBy', uploadedBy.toString());

      console.log('上傳檔案參數:', {
        fileName: file.name,
        entityType: entityType,
        entityId: entityId,
        uploadedBy: uploadedBy
      });

      const response = await fetch(getApiUrl('/fileupload/upload'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('上傳失敗響應:', errorText);
        throw new Error(`上傳檔案失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('上傳成功響應:', result);
      return result;
    } catch (error) {
      console.error('上傳檔案錯誤:', error);
      throw error;
    }
  },

  // 下載檔案 - 修復檔案ID處理
  async downloadFile(fileId) {
    try {
      // 確保檔案ID是整數
      const intFileId = parseInt(fileId);
      if (isNaN(intFileId)) {
        throw new Error(`無效的檔案ID: ${fileId}`);
      }

      console.log('下載檔案ID:', intFileId);

      const response = await fetch(getApiUrl(`/fileupload/download/${intFileId}`), {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('下載失敗響應:', errorText);
        throw new Error(`下載檔案失敗: ${response.status} ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('下載檔案錯誤:', error);
      throw error;
    }
  }
};

export default { pointsAPI, workLogAPI, fileUploadAPI };
