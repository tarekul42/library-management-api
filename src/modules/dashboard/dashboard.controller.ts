import type { Context } from "hono";
import * as dashboardService from './dashboard.service.js';

export async function getStats(c: Context) {
  const data = await dashboardService.getStats();
  return c.json({ success: true, data });
}

export async function getPopularBooks(c: Context) {
  const data = await dashboardService.getPopularBooks();
  return c.json({ success: true, data });
}

export async function getTrends(c: Context) {
  const data = await dashboardService.getTrends();
  return c.json({ success: true, data });
}

export async function getGenreDistribution(c: Context) {
  const data = await dashboardService.getGenreDistribution();
  return c.json({ success: true, data });
}
