import { Auth } from '@common/decorators';
import { Controller, Get, Query } from '@nestjs/common';

import { PlaceAutocompleteQueryDto, PlaceDetailsQueryDto } from './dto';
import { PlacesProxyService } from './places-proxy.service';

@Controller('service-stations/places')
@Auth()
export class PlacesController {
  constructor(private readonly placesProxyService: PlacesProxyService) {}

  @Get('autocomplete')
  autocomplete(@Query() query: PlaceAutocompleteQueryDto) {
    return this.placesProxyService.autocomplete(query.query, query.sessionToken);
  }

  @Get('details')
  getDetails(@Query() query: PlaceDetailsQueryDto) {
    return this.placesProxyService.getDetails(query.placeId, query.sessionToken);
  }
}
