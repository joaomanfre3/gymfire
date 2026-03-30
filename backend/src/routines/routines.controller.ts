import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AddRoutineSetDto } from './dto/add-routine-set.dto';

@UseGuards(JwtAuthGuard)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateRoutineDto) {
    return this.routinesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.routinesService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routinesService.findById(id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.routinesService.delete(id, req.user.id);
  }

  @Post(':id/sets')
  addSet(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddRoutineSetDto,
  ) {
    return this.routinesService.addSet(id, req.user.id, dto);
  }

  @Delete(':id/sets/:setId')
  removeSet(
    @Request() req: any,
    @Param('id') id: string,
    @Param('setId') setId: string,
  ) {
    return this.routinesService.removeSet(id, req.user.id, setId);
  }
}
