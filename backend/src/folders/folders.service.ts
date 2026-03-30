import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        userId,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(folderId: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    return folder;
  }

  async update(folderId: string, userId: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    return this.prisma.folder.update({
      where: { id: folderId },
      data: dto,
    });
  }

  async delete(folderId: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    return this.prisma.folder.delete({ where: { id: folderId } });
  }

  async addItem(
    folderId: string,
    userId: string,
    exerciseId: string,
    order: number,
  ) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    return this.prisma.folderItem.create({
      data: {
        folderId,
        exerciseId,
        order,
      },
      include: { exercise: true },
    });
  }

  async removeItem(folderId: string, userId: string, itemId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    const item = await this.prisma.folderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.folderId !== folderId) {
      throw new NotFoundException('Item not found');
    }

    return this.prisma.folderItem.delete({ where: { id: itemId } });
  }
}
