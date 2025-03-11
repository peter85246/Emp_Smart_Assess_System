import axios from "axios";

// API 基礎URL配置，可通過環境變量設置
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

// 新增：XML 解析和轉換工具
const xmlParser = {
  parseXML: (xmlString) => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "application/xml");
  },

  convertToJSON: (xmlDoc) => {
    const result = {};
    const root = xmlDoc.documentElement;

    function parseNode(node, obj) {
      const children = node.children;
      if (children.length === 0) {
        obj[node.tagName] = node.textContent;
      } else {
        obj[node.tagName] = {};
        Array.from(children).forEach((child) => {
          parseNode(child, obj[node.tagName]);
        });
      }
    }

    parseNode(root, result);
    return result;
  },
};

export const performanceAPI = {
  // 獲取員工績效數據
  // 支持 JSON 和 XML 格式（需要後端配合）
  async getEmployeeData(employeeId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/employees/${employeeId}/performance`,
        {
          headers: {
            // 可以通過設置 Accept 頭來指定期望的響應格式
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
      console.error("獲取員工數據失敗:", error);
      throw error;
    }
  },

  // 獲取歷史績效數據
  async getHistoricalData(employeeId, startDate, endDate) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/employees/${employeeId}/historical`,
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
        `${API_BASE_URL}/machine-status/${employeeId}`,
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
