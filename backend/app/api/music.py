from urllib import error, parse, request
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/music", tags=["music"])


class SpotifyTokenExchangeRequest(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: str
    client_id: str


# Exchanges a Spotify authorization code for access tokens.
@router.post("/spotify/token")
async def exchange_spotify_token(payload: SpotifyTokenExchangeRequest):
    form = parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": payload.code,
            "redirect_uri": payload.redirect_uri,
            "client_id": payload.client_id,
            "code_verifier": payload.code_verifier,
        }
    ).encode("utf-8")

    req = request.Request(
        "https://accounts.spotify.com/api/token",
        data=form,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with request.urlopen(req, timeout=15) as res:
            body = res.read().decode("utf-8")
            return json.loads(body)
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8")
        raise HTTPException(status_code=exc.code, detail=details) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Spotify token exchange failed") from exc
