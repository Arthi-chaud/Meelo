import { ConsoleLogger, LogLevel } from '@nestjs/common';

export default class Logger extends ConsoleLogger {
	constructor(context?: string) {
		if (context) {
			super(context);
		} else {
			super();
		}
		if (process.env.NODE_ENV == 'test') {
			this.setLogLevels([]);
		}
	}

	override formatMessage(
		logLevel: LogLevel, message: unknown,
		_pidMessage: string, formattedLogLevel: string,
		contextMessage: string, _timestampDiff: string
	): string {
		const output = this.stringifyMessage(message, logLevel);

		formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
		return `${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}: ${output}\n`;
	}
}
