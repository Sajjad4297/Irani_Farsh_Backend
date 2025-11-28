import { Injectable } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountsRepository } from './discounts.repository';

@Injectable()
export class DiscountsService {
    constructor(private readonly discountsRepository: DiscountsRepository){}
  async create(body: CreateDiscountDto) {
    await this.discountsRepository.create(body);
    return({success: true,message: 'Discount created successfully'});
  }

  async findAll() {
    const data = await this.discountsRepository.findAll();
    return ({ success: true, message: 'Discounts got successfully', data });
  }

  async update(id: number, body: UpdateDiscountDto) {
    await this.discountsRepository.update(id, body);
    return ({ success: true, message: 'Discount updated successfully' });
  }

  async remove(id: number) {
    await this.discountsRepository.delete(id);
    return ({ success: true, message: 'Discount deleted successfully' });
  }
}
