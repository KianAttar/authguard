enum AuthProvider {
    GOOGLE = "google",
    APPLE = "apple",
    MICROSOFT = "microsoft"
}

enum ChallengeMethod {
    TOTP = "totp",
    EMAIL = "email",
    SMS = "sms"
}

enum AuthMethod {
    PASSWORD = "password",
    ONE_TIME_PASSWORD = "otp",
    SOCIAL_SIGN_ON = "sso"
}

enum UserRole {
    USER = "user",
    ADMIN = "admin"
}

export { AuthProvider, ChallengeMethod, AuthMethod, UserRole };
