import { getApiUrl } from '../config/apiConfig';

/**
 * 積分管理API服務模組
 * 功能：封裝所有與積分相關的API呼叫
 * 包含：積分提交、查詢、審核、檔案操作
 * 
 * 主要方法：
 * - submitBatchPoints: 批量提交積分（支援多項目+檔案）
 * - getEmployeePoints: 獲取員工積分記錄
 * - getPendingEntries: 獲取待審核項目（主管專用）
 * - downloadFile: 檔案下載功能
 */
export const pointsAPI = {
  /**
   * 批量提交積分項目 - 核心提交功能
   * API: POST /api/points/batch/submit
   * 功能：支援多項目同時提交，每項目可關聯多個檔案
   * 特色：智能檔案索引映射，確保檔案正確關聯到對應項目
   * 
   * @param {Object} data - 提交數據
   * @param {number} data.employeeId - 員工ID
   * @param {string} data.submissionDate - 提交日期
   * @param {string} data.status - 狀態（通常為pending）
   * @param {number} data.totalPoints - 總積分
   * @param {Object} data.items - 積分項目對象
   * @param {Object} data.files - 檔案對象 {itemId: [File, File, ...]}
   * @returns {Promise} 提交結果
   */
  async submitBatchPoints(data) {
    try {
      // 創建FormData來符合後端要求
      const formData = new FormData();
      
      // 後端期望的字段格式
      formData.append('employeeId', data.employeeId.toString());
      formData.append('submissionDate', data.submissionDate);
      formData.append('status', data.status || 'pending');
      formData.append('totalPoints', data.totalPoints.toString());
      
      // 將items對象轉換為後端期望的數組格式，並建立索引映射
      const itemsArray = [];
      const itemIndexMap = {}; // 原始itemId -> 數組索引的映射

      if (data.items) {
        let arrayIndex = 0;
        Object.entries(data.items).forEach(([key, item]) => {
          if (item && (item.checked || item.value > 0 || item.selectedValue > 0)) {
            itemsArray.push({
              categoryName: item.categoryName || item.name || key, // 使用categoryName作為積分項目類別名稱
              description: item.description || '', // 員工填寫的工作說明
              calculatedPoints: parseFloat(item.calculatedPoints || item.points || 0),
              checked: item.checked,
              value: item.value,
              selectedValue: item.selectedValue
            });
            // 記錄原始itemId到數組索引的映射
            itemIndexMap[key] = arrayIndex;
            arrayIndex++;
          }
        });
      }
      
      console.log('轉換後的items數組:', itemsArray);
      console.log('項目索引映射:', itemIndexMap);
      formData.append('items', JSON.stringify(itemsArray));
      
      // 如果有檔案，使用正確的索引生成檔案鍵
      if (data.files && Object.keys(data.files).length > 0) {
        Object.entries(data.files).forEach(([itemId, fileArray]) => {
          // 獲取該項目在數組中的實際索引
          const actualIndex = itemIndexMap[itemId];
          if (actualIndex !== undefined) {
            if (Array.isArray(fileArray)) {
              // 處理檔案數組格式：{ itemId: [File, File, ...] }
              fileArray.forEach((file, fileIndex) => {
                if (file instanceof File) {
                  // 使用實際的數組索引生成檔案鍵
                  const fileKey = `g${actualIndex + 1}_${fileIndex}`;
                  formData.append('files', file);
                  formData.append('fileKeys', fileKey);
                  console.log(`添加檔案: ${file.name}, 原始ID: ${itemId}, 實際索引: ${actualIndex}, 檔案鍵: ${fileKey}`);
                }
              });
            } else if (fileArray instanceof File) {
              // 處理單個檔案格式：{ key: File }
              const fileKey = `g${actualIndex + 1}_0`;
              formData.append('files', fileArray);
              formData.append('fileKeys', fileKey);
              console.log(`添加檔案: ${fileArray.name}, 原始ID: ${itemId}, 實際索引: ${actualIndex}, 檔案鍵: ${fileKey}`);
            }
          } else {
            console.warn(`項目 ${itemId} 有檔案但未在提交項目中找到，跳過檔案上傳`);
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

  // 根據部門權限獲取待審核記錄
  async getPendingEntriesByDepartment(reviewerId) {
    try {
      const response = await fetch(getApiUrl(`/points/pending/department?reviewerId=${reviewerId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取部門待審核記錄失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取部門待審核記錄錯誤:', error);
      throw error;
    }
  },

  // 獲取積分摘要
  async getEmployeePointsSummary(employeeId, month) {
    try {
      const url = month
        ? `/points/employee/${employeeId}/summary?month=${month}`
        : `/points/employee/${employeeId}/summary`;

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
  },

  // 批量審核通過
  async batchApprovePoints(entryIds, approverId, comments) {
    try {
      const response = await fetch(getApiUrl('/points/batch/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryIds: entryIds,
          approverId: approverId,
          comments: comments || '批量審核通過'
        })
      });

      if (!response.ok) {
        throw new Error(`批量審核通過失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('批量審核通過錯誤:', error);
      throw error;
    }
  },

  // 批量審核拒絕
  async batchRejectPoints(entryIds, rejectedBy, reason) {
    try {
      const response = await fetch(getApiUrl('/points/batch/reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryIds: entryIds,
          rejectedBy: rejectedBy,
          reason: reason || '批量審核拒絕'
        })
      });

      if (!response.ok) {
        throw new Error(`批量審核拒絕失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('批量審核拒絕錯誤:', error);
      throw error;
    }
  },

  // 下載檔案（添加到pointsAPI中以支持主管審核頁面）
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
  },

  /**
   * 獲取積分標準項目
   * API: GET /api/standards
   * 功能：獲取所有積分標準項目，支援部門過濾
   * 
   * @param {number} departmentId - 可選的部門ID，用於過濾
   * @returns {Promise} 標準項目列表
   */
  async getStandards(departmentId = null) {
    try {
      console.log('獲取積分標準項目 - 部門ID:', departmentId);
      
      // 決定使用哪個API端點
      let url = '/standards';
      if (departmentId) {
        url = `/standards/department/${departmentId}`;
      }

      const response = await fetch(getApiUrl(url), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('獲取標準項目失敗響應:', errorText);
        throw new Error(`獲取標準項目失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('獲取標準項目成功:', result);
      return result;
    } catch (error) {
      console.error('獲取積分標準項目錯誤:', error);
      throw error;
    }
  },

  /**
   * 根據部門ID獲取員工部門排名
   * API: GET /api/points/department-rank/{employeeId}
   * 功能：獲取員工在部門中的積分排名
   * 
   * @param {number} employeeId - 員工ID
   * @returns {Promise} 部門排名數據
   */
  async getEmployeeDepartmentRank(employeeId) {
    try {
      console.log('獲取員工部門排名 - 員工ID:', employeeId);

      const response = await fetch(getApiUrl(`/points/department-rank/${employeeId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('獲取部門排名失敗響應:', errorText);
        throw new Error(`獲取部門排名失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('獲取部門排名成功:', result);
      return result;
    } catch (error) {
      console.error('獲取員工部門排名錯誤:', error);
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

const PointsAPIService = { pointsAPI, workLogAPI, fileUploadAPI };
export default PointsAPIService;
