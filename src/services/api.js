import axios from "axios";
// TODO: 串接真正API時需要註釋掉以下這行 mock 數據導入
import { mockXMLResponse, mockJSONResponse } from '../mocks/mockApiResponses';
import { API_CONFIG } from '../config/apiConfig';

// 新增：XML 解析和轉換工具
const xmlParser = {
  parseXML: (xmlString) => {
    try {
      // 移除字符串開頭的空白字符
      const cleanXmlString = xmlString.trim();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanXmlString, "application/xml");
      
      // 檢查解析錯誤
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("XML解析錯誤：" + parserError[0].textContent);
      }
      
      return xmlDoc;
    } catch (error) {
      console.error("XML解析失敗：", error);
      throw error;
    }
  },

  convertToJSON: (xmlDoc) => {
    try {
      const result = {};
      const root = xmlDoc.documentElement;

      function parseNode(node, obj) {
        // 處理屬性
        Array.from(node.attributes).forEach(attr => {
          obj[`@${attr.name}`] = attr.value;
        });

        // 處理子節點
        Array.from(node.children).forEach(child => {
          const childName = child.tagName;
          
          // 特殊處理 historicalData
          if (childName === 'record') {
            if (!obj.records) obj.records = [];
            const record = {};
            Array.from(child.children).forEach(field => {
              record[field.tagName] = field.textContent;
            });
            obj.records.push(record);
          } else if (child.children.length === 0) {
            // 葉子節點
            obj[childName] = child.textContent;
          } else {
            // 非葉子節點
            obj[childName] = {};
            parseNode(child, obj[childName]);
          }
        });
      }

      parseNode(root, result);
      return result;
    } catch (error) {
      console.error("JSON轉換失敗：", error);
      throw error;
    }
  }
};

// 獲取當前環境的API基礎URL
const getBaseUrl = () => {
  const env = API_CONFIG.CURRENT_ENV;
  return API_CONFIG.ENVIRONMENTS[env].BASE_URL;
};

// 模擬API響應延遲
const mockAPIDelay = (data, contentType, systemInfo) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data,
        headers: {
          'content-type': contentType,
          'x-system-source': systemInfo.SYSTEM_TYPE,
          'x-api-version': '1.0',
          'x-request-id': Math.random().toString(36).substring(7)
        }
      });
    }, 1000);
  });
};

export const performanceAPI = {
  // 獲取員工績效數據
  // 支持 JSON 和 XML 格式（需要後端配合）
  async getEmployeeData(employeeId, format = 'json') {
    try {
      const currentEnv = API_CONFIG.ENVIRONMENTS[API_CONFIG.CURRENT_ENV];
      
      // 只在第一次調用時顯示系統信息
      if (!this.systemInfoShown) {
        console.group('ERP系統整合資訊');
        console.log({
          外部系統: 'SAP_ERP系統',
          連接位置: '192.168.1.100:8080/erp-system',
          支援格式: ['JSON', 'XML', 'CSV']
        });
        console.groupEnd();
        this.systemInfoShown = true;
      }

      // 簡化數據交換過程日誌
      const startTime = performance.now();
      let response;

      // TODO: 串接真正API時需要註釋掉以下整個 if-else 區塊，改用真正的 axios API 調用
      // ===== MOCK 數據區塊開始 =====
      if (format === 'xml') {
        response = await mockAPIDelay(mockXMLResponse, API_CONFIG.FORMATS.XML, currentEnv, 100);
        const xmlDoc = xmlParser.parseXML(response.data);
        const jsonData = xmlParser.convertToJSON(xmlDoc);
        return { employeeData: jsonData };
      } else {
        response = await mockAPIDelay(mockJSONResponse, API_CONFIG.FORMATS.JSON, currentEnv, 100);
        return response.data;
      }
      // ===== MOCK 數據區塊結束 =====

      // TODO: 串接真正API時，解除以下註釋並配置正確的API端點
      /*
      if (format === 'xml') {
        response = await axios.get(
          `${getBaseUrl()}${API_CONFIG.ENDPOINTS.PERFORMANCE}/${employeeId}`,
          {
            headers: {
              Accept: "application/xml",
            },
          }
        );
        const xmlDoc = xmlParser.parseXML(response.data);
        const jsonData = xmlParser.convertToJSON(xmlDoc);
        return { employeeData: jsonData };
      } else {
        response = await axios.get(
          `${getBaseUrl()}${API_CONFIG.ENDPOINTS.PERFORMANCE}/${employeeId}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        return response.data;
      }
      */
    } catch (error) {
      console.error('數據獲取失敗：', error);
      throw error;
    }
  },

  // 獲取歷史績效數據
  async getHistoricalData(employeeId, startDate, endDate) {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HISTORICAL}/${employeeId}`,
        {
          params: { startDate, endDate },
          headers: {
            Accept: "application/json, application/xml",
          },
        },
      );

      // 根據響應類型處理數據
      const contentType = response.headers["content-type"];
      if (contentType.includes("application/xml")) {
        const xmlDoc = xmlParser.parseXML(response.data);
        return xmlParser.convertToJSON(xmlDoc);
      }

      return response.data;
    } catch (error) {
      console.error("獲取歷史數據失敗:", error);
      throw error;
    }
  },

  // 獲取機台運行狀態
  async getMachineStatus(employeeId) {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/machine-status/${employeeId}`,
      );
      return response.data;
    } catch (error) {
      console.error("獲取機台狀態失敗:", error);
      throw error;
    }
  },

  // 新增：獲取加班記錄
  async getOvertimeRecords(employeeId) {
    try {
      const response = await axios.get(`/api/overtime/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("獲取加班記錄失敗:", error);
      throw error;
    }
  },

  // 新增：獲取特殊貢獻記錄
  async getSpecialContributions(employeeId) {
    try {
      const response = await axios.get(`/api/contributions/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("獲取特殊貢獻記錄失敗:", error);
      throw error;
    }
  },
};
