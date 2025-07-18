using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace PointsManagementAPI.Controllers
{
    [ApiController]
    [Route("api")]
    public class ApiController : ControllerBase
    {
        [HttpGet("server-info")]
        public ActionResult GetServerInfo()
        {
            var serverInfo = new
            {
                name = "PointsManagement API",
                version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                status = "running",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                endpoints = new
                {
                    auth = "/api/auth",
                    points = "/api/points",
                    standards = "/api/standards",
                    worklog = "/api/worklog",
                    fileupload = "/api/fileupload",
                    health = "/health"
                }
            };

            return Ok(serverInfo);
        }

        [HttpGet("ping")]
        public ActionResult Ping()
        {
            return Ok(new { message = "pong", timestamp = DateTime.UtcNow });
        }
    }
}
