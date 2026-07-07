import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PlaceAutocompleteQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare query: string;

  @IsString()
  @IsNotEmpty()
  declare sessionToken: string;
}

export class PlaceDetailsQueryDto {
  @IsString()
  @IsNotEmpty()
  declare placeId: string;

  @IsString()
  @IsNotEmpty()
  declare sessionToken: string;
}
