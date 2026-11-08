/// Validate a single IMEI (15 digits)
pub fn is_valid_imei(imei: &str) -> bool {
    imei.len() == 15 && imei.chars().all(|c| c.is_ascii_digit())
}

/// Parse IMEI list from newline/comma separated string
pub fn parse_imei_list(input: &str) -> Vec<String> {
    input
        .split(|c| c == '\n' || c == ',' || c == ';')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_imei() {
        assert!(is_valid_imei("123456789012345"));
    }

    #[test]
    fn invalid_imei_short() {
        assert!(!is_valid_imei("12345678901234"));
    }

    #[test]
    fn invalid_imei_letters() {
        assert!(!is_valid_imei("12345678901234a"));
    }

    #[test]
    fn parse_imei_list_newlines() {
        let result = parse_imei_list("123456789012345\n987654321098765");
        assert_eq!(result.len(), 2);
    }
}

