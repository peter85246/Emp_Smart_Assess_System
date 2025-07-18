using BCrypt.Net;

class Program
{
    static void Main()
    {
        string password = "123456";
        string hash = BCrypt.Net.BCrypt.HashPassword(password);
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"Hash: {hash}");
        
        // 驗證
        bool isValid = BCrypt.Net.BCrypt.Verify(password, hash);
        Console.WriteLine($"Verification: {isValid}");
        
        // 測試現有的哈希
        string existingHash = "$2a$11$K/VE4UkO2.LnMGKZPPmRreXAqBUSzTIBGFg1Fq4UGH6kAhKKH7EyS";
        bool isExistingValid = BCrypt.Net.BCrypt.Verify(password, existingHash);
        Console.WriteLine($"Existing hash verification: {isExistingValid}");
    }
}
