using Microsoft.AspNetCore.Mvc;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Services;

namespace PointsManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StandardsController : ControllerBase
    {
        private readonly IStandardsService _standardsService;

        public StandardsController(IStandardsService standardsService)
        {
            _standardsService = standardsService;
        }

        [HttpGet]
        public async Task<ActionResult<List<StandardSetting>>> GetAllStandards()
        {
            var standards = await _standardsService.GetAllStandardsAsync();
            return Ok(standards);
        }

        [HttpGet("department/{departmentId}")]
        public async Task<ActionResult<List<StandardSetting>>> GetStandardsByDepartment(int departmentId)
        {
            var standards = await _standardsService.GetStandardsByDepartmentAsync(departmentId);
            return Ok(standards);
        }

        [HttpGet("type/{pointsType}")]
        public async Task<ActionResult<List<StandardSetting>>> GetStandardsByType(string pointsType)
        {
            var standards = await _standardsService.GetStandardsByTypeAsync(pointsType);
            return Ok(standards);
        }

        [HttpGet("tree")]
        public async Task<ActionResult<List<StandardSetting>>> GetStandardsTree()
        {
            var standards = await _standardsService.GetStandardsTreeAsync();
            return Ok(standards);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StandardSetting>> GetStandard(int id)
        {
            var standard = await _standardsService.GetStandardByIdAsync(id);
            if (standard == null)
                return NotFound();

            return Ok(standard);
        }

        [HttpPost]
        public async Task<ActionResult<StandardSetting>> CreateStandard([FromBody] StandardSetting standard)
        {
            try
            {
                var createdStandard = await _standardsService.CreateStandardAsync(standard);
                return CreatedAtAction(nameof(GetStandard), new { id = createdStandard.Id }, createdStandard);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<StandardSetting>> UpdateStandard(int id, [FromBody] StandardSetting standard)
        {
            if (id != standard.Id)
                return BadRequest();

            try
            {
                var updatedStandard = await _standardsService.UpdateStandardAsync(standard);
                return Ok(updatedStandard);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteStandard(int id)
        {
            var result = await _standardsService.DeleteStandardAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
