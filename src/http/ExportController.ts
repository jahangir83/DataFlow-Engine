import { ExportService } from "../services/ExportService";
import { ExportQuery } from "../domain/ExportQuery";
import type { Request, Response } from "express";

export class ExportController {
  constructor(private service: ExportService) {}

  async stream(req: Request, res: Response) {
    return this.service.stream(req, res);
  }
}
