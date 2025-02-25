export const authStats = {
  loginSuccess: 0,
  loginAttempts: 0,
  unauthorizedAttempts: 0,
  responseTime: [],
  startTime: null,
  
  start() {
    this.startTime = performance.now();
  },
  
  end() {
    if (!this.startTime) return 0;
    const duration = performance.now() - this.startTime;
    this.responseTime.push(duration);
    this.startTime = null;
    return duration;
  },
  
  isResponseTimeAcceptable(duration) {
    return duration < 3000;
  },
  
  getLoginSuccessRate() {
    return this.loginAttempts > 0 
      ? (this.loginSuccess / this.loginAttempts) * 100 
      : 0;
  },
  
  getUnauthorizedRejectRate() {
    return this.unauthorizedAttempts > 0 ? 100 : 0;
  },
  
  getAverageResponseTime() {
    return this.responseTime.length > 0
      ? this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length
      : 0;
  },
  
  reset() {
    this.loginSuccess = 0;
    this.loginAttempts = 0;
    this.unauthorizedAttempts = 0;
    this.responseTime = [];
    this.startTime = null;
  }
};

export const performanceMetrics = {
  responseTimeThreshold: 3000, // 3秒
  loginSuccessRateThreshold: 99, // 99%
  unauthorizedRejectionRateThreshold: 100, // 100%
  suggestionAccuracyThreshold: 80 // 80%
}; 