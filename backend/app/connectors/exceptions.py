from typing import Optional


class ConnectorError(Exception):
    """Base connector exception with retry hint for upper-level tasks."""

    def __init__(self, message: str, *, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


class ConnectorAuthError(ConnectorError):
    def __init__(self, message: str = "Connector authentication failed"):
        super().__init__(message, retryable=False)


class ConnectorRateLimitError(ConnectorError):
    def __init__(self, message: str = "Connector API rate limit exceeded"):
        super().__init__(message, retryable=True)


class ConnectorTimeoutError(ConnectorError):
    def __init__(self, message: str = "Connector API request timed out"):
        super().__init__(message, retryable=True)


class ConnectorAPIError(ConnectorError):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        retryable: bool = False,
    ):
        super().__init__(message, retryable=retryable)
        self.status_code = status_code


class ConnectorResponseError(ConnectorError):
    def __init__(self, message: str = "Connector API returned malformed response"):
        super().__init__(message, retryable=False)
