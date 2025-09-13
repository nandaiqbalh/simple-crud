import { UserDto, CreateUserDto, UpdateUserDto } from '@/dtos/user.dto';
import { User, CreateUserForm, UpdateUserForm, UserRole } from '@/entities/user.entity';

export class UserMapper {
  static toEntity(dto: UserDto): User {
    const birth = new Date(dto.birth);
    const timestamp = new Date(dto.timestamp);
    
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      role: dto.role as UserRole,
      birth,
      age: dto.age,
      timestamp,
      formattedBirth: birth.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      formattedTimestamp: timestamp.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      })
    };
  }

  static toEntityList(dtos: UserDto[] | null | undefined): User[] {
    if (!dtos) return [];
    return dtos.map(this.toEntity);
  }

  static toCreateDto(form: CreateUserForm): CreateUserDto {
    return {
      name: form.name,
      email: form.email,
      role: form.role,
      birth: form.birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
    };
  }

  static toUpdateDto(form: UpdateUserForm): UpdateUserDto {
    return {
      id: form.id,
      name: form.name,
      email: form.email,
      role: form.role,
      birth: form.birth.toISOString().split('T')[0] // Convert to YYYY-MM-DD
    };
  }

  static fromEntityToUpdateForm(entity: User): UpdateUserForm {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      birth: entity.birth
    };
  }
}