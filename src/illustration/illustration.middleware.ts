
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class IllustrationMiddleware implements NestMiddleware {
	use(req: Request, _res: Response, next: NextFunction) {
		const illustrationRouteSuffix = '/illustration';
		const illustrationRoutePrefix = '/illustrations';
		if (req.url.endsWith(illustrationRouteSuffix)) {
			req.url = `${illustrationRoutePrefix}${req.url.replace(illustrationRouteSuffix, '')}`;
			Logger.debug(req.url);
		}
		next();
	}
}
