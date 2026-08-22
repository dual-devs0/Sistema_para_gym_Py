import pytest

from app.services.sifen_client import SifenClient


@pytest.mark.asyncio
async def test_disabled_without_certificate_paths():
    client = SifenClient(client_cert_path=None, client_key_path=None)
    result = await client.send_de(b"<rDE></rDE>")
    assert result == {"status": "disabled"}


@pytest.mark.asyncio
async def test_transmission_never_raises_on_network_failure(monkeypatch):
    from app.services import sifen_client as sifen_client_module

    class FailingAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, *args, **kwargs):
            raise ConnectionError("simulated network failure")

    monkeypatch.setattr(sifen_client_module.httpx, "AsyncClient", FailingAsyncClient)

    client = SifenClient(client_cert_path="/fake/cert.pem", client_key_path="/fake/key.pem")
    result = await client.send_de(b"<rDE></rDE>")
    assert result["status"] == "failed"
    assert "simulated network failure" in result["error"]


@pytest.mark.asyncio
async def test_transmission_payload_shape_when_enabled(monkeypatch):
    from app.services import sifen_client as sifen_client_module

    captured = {}

    class FakeResponse:
        text = "<soap:Envelope>ok</soap:Envelope>"

        def raise_for_status(self):
            pass

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            captured["init_kwargs"] = kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, content, headers):
            captured["url"] = url
            captured["content"] = content
            captured["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr(sifen_client_module.httpx, "AsyncClient", FakeAsyncClient)

    client = SifenClient(client_cert_path="/fake/cert.pem", client_key_path="/fake/key.pem")
    result = await client.send_de(b"<rDE><DE Id='X'></DE></rDE>")

    assert result["status"] == "transmitted"
    assert captured["url"] == "/de/ws/sync/recibe.wsdl"
    assert b"<rDE>" in captured["content"]
    assert captured["init_kwargs"]["cert"] == ("/fake/cert.pem", "/fake/key.pem")
