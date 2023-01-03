import { ConsoleLogger, LogLevel } from '@nestjs/common';

export default class Logger extends ConsoleLogger {
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
