import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { ApifyScrapingResult } from './apifyService';

export class ExportService {
  private readonly EXPORTS_DIR = path.join(process.cwd(), 'exports');

  constructor() {
    this.ensureExportsDir();
  }

  private async ensureExportsDir() {
    try {
      await fs.access(this.EXPORTS_DIR);
    } catch {
      await fs.mkdir(this.EXPORTS_DIR, { recursive: true });
    }
  }

  async exportToExcel(data: ApifyScrapingResult[], filename: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Instagram Data');

    // Define columns
    worksheet.columns = [
      { header: 'Post ID', key: 'id', width: 20 },
      { header: 'Username', key: 'ownerUsername', width: 20 },
      { header: 'Full Name', key: 'ownerFullName', width: 25 },
      { header: 'Caption', key: 'caption', width: 50 },
      { header: 'Likes Count', key: 'likesCount', width: 15 },
      { header: 'Comments Count', key: 'commentsCount', width: 15 },
      { header: 'Post Type', key: 'type', width: 15 },
      { header: 'Sponsored', key: 'isSponsored', width: 10 },
      { header: 'Post URL', key: 'url', width: 40 },
      { header: 'Hashtags', key: 'hashtags', width: 30 },
      { header: 'Date', key: 'timestamp', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Add data
    data.forEach(item => {
      worksheet.addRow({
        ...item,
        hashtags: Array.isArray(item.hashtags) ? item.hashtags.join(', ') : '',
        isSponsored: item.isSponsored ? 'Yes' : 'No',
        timestamp: new Date(item.timestamp).toLocaleDateString(),
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.key !== 'caption') {
        column.width = Math.max(column.width || 10, 12);
      }
    });

    const filePath = path.join(this.EXPORTS_DIR, filename);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }

  async exportToCSV(data: ApifyScrapingResult[], filename: string): Promise<string> {
    const headers = [
      'Post ID',
      'Username',
      'Full Name',
      'Caption',
      'Likes Count',
      'Comments Count',
      'Post Type',
      'Sponsored',
      'Post URL',
      'Hashtags',
      'Date'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.id || ''}"`,
        `"${item.ownerUsername || ''}"`,
        `"${item.ownerFullName || ''}"`,
        `"${(item.caption || '').replace(/"/g, '""')}"`,
        item.likesCount || 0,
        item.commentsCount || 0,
        `"${item.type || ''}"`,
        item.isSponsored ? 'Yes' : 'No',
        `"${item.url || ''}"`,
        `"${Array.isArray(item.hashtags) ? item.hashtags.join(', ') : ''}"`,
        `"${new Date(item.timestamp).toLocaleDateString()}"`,
      ].join(','))
    ].join('\n');

    const filePath = path.join(this.EXPORTS_DIR, filename);
    await fs.writeFile(filePath, csvContent, 'utf-8');
    
    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async exportToExcelBuffer(data: ApifyScrapingResult[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Instagram Data');

    // Define columns
    worksheet.columns = [
      { header: 'Post ID', key: 'id', width: 20 },
      { header: 'Username', key: 'ownerUsername', width: 20 },
      { header: 'Full Name', key: 'ownerFullName', width: 25 },
      { header: 'Caption', key: 'caption', width: 50 },
      { header: 'Likes Count', key: 'likesCount', width: 15 },
      { header: 'Comments Count', key: 'commentsCount', width: 15 },
      { header: 'Post Type', key: 'type', width: 15 },
      { header: 'Sponsored', key: 'isSponsored', width: 10 },
      { header: 'Post URL', key: 'url', width: 40 },
      { header: 'Hashtags', key: 'hashtags', width: 30 },
      { header: 'Date', key: 'timestamp', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Add data
    data.forEach(item => {
      worksheet.addRow({
        ...item,
        hashtags: Array.isArray(item.hashtags) ? item.hashtags.join(', ') : '',
        isSponsored: item.isSponsored ? 'Yes' : 'No',
        timestamp: new Date(item.timestamp).toLocaleDateString(),
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.key !== 'caption') {
        column.width = Math.max(column.width || 10, 12);
      }
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async exportToCSVBuffer(data: ApifyScrapingResult[]): Promise<Buffer> {
    const headers = [
      'Post ID',
      'Username',
      'Full Name',
      'Caption',
      'Likes Count',
      'Comments Count',
      'Post Type',
      'Sponsored',
      'Post URL',
      'Hashtags',
      'Date'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.id || ''}"`,
        `"${item.ownerUsername || ''}"`,
        `"${item.ownerFullName || ''}"`,
        `"${(item.caption || '').replace(/"/g, '""')}"`,
        item.likesCount || 0,
        item.commentsCount || 0,
        `"${item.type || ''}"`,
        item.isSponsored ? 'Yes' : 'No',
        `"${item.url || ''}"`,
        `"${Array.isArray(item.hashtags) ? item.hashtags.join(', ') : ''}"`,
        `"${new Date(item.timestamp).toLocaleDateString()}"`,
      ].join(','))
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }
}

export const exportService = new ExportService();
