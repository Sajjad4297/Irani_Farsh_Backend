import { BadRequestException, PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(files: Record<string, any[]> | undefined) {
    if (!files || Object.keys(files).length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 2MB

    for (const key of Object.keys(files)) {
      const fileArray = files[key];
      if (!fileArray || fileArray.length === 0) continue;

      for (const file of fileArray) {
        if (!allowed.includes(file.mimetype)) {
          throw new BadRequestException(`Invalid image type for ${file.filename}: ${file.mimetype}`);
        }
        if (file.size > maxSize) {
          throw new BadRequestException(`File ${file.filename} exceeds 2MB`);
        }
      }
    }

    return files;
  }
}
