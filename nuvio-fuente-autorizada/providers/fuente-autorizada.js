"use strict";

/**
 * Proveedor Nuvio de demostracion para una fuente autorizada.
 *
 * Contrato esperado por Nuvio:
 *   getStreams(tmdbId, mediaType, season, episode) -> Promise<Array<Stream>>
 *
 * Este proveedor NO extrae contenido de terceros. Devuelve un HLS publico
 * de demostracion para validar que el repositorio y el cargador de Nuvio
 * funcionan. Sustituye DEMO_STREAM_URL por tu propia API o CDN autorizada.
 */

const DEMO_STREAM_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

async function getStreams(tmdbId, mediaType = "movie", season = null, episode = null) {
  if (!tmdbId) return [];

  const isTv = mediaType === "tv";
  const suffix = isTv && season != null && episode != null
    ? ` S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`
    : "";

  return [
    {
      name: "Fuente Autorizada Demo - HLS",
      title: `Demo TMDB ${tmdbId}${suffix}`,
      url: DEMO_STREAM_URL,
      quality: "Auto",
      size: "Unknown",
      provider: "fuente-autorizada-demo"
    }
  ];
}

module.exports = { getStreams };
