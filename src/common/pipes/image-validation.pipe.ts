import { BadRequestException, PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  /** When false, an empty upload is allowed (but any provided file is still validated). */
  protected readonly required: boolean = true;

  transform(files: Record<string, any[]> | undefined) {
    if (!files || Object.keys(files).length === 0) {
      if (!this.required) return files ?? {};
      throw new BadRequestException('At least one file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    const maxSize = 10 * 1024 * 1024; // 2MB

    for (const key of Object.keys(files)) {
      const fileArray = files[key];
      if (!fileArray || fileArray.length === 0) continue;

      for (const file of fileArray) {
        if (!allowed.includes(file.mimetype)) {
          throw new BadRequestException(`Invalid image type for ${file.filename}: ${file.mimetype}`);
        }
        if (!allowedExt.includes(file.ext)) {
          throw new BadRequestException(`Invalid image extension for ${file.filename}`);
        }
        if (file.size > maxSize) {
          throw new BadRequestException(`File ${file.filename} exceeds 2MB`);
        }
      }
    }

    return files;
  }
}

@Injectable()
export class OptionalImageValidationPipe extends ImageValidationPipe {
  protected readonly required = false;
}
