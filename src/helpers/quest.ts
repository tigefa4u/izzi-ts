/**
 * Weekly Quest is reset every Sunday midnight
 * @returns
 */
export const getWeeklyQuestDates = () => {
	const currentDate = new Date();

	// Calculate the number of days to subtract to get to Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
	const daysToSubtract = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;

	// Calculate fromDate by subtracting the days to get to Monday
	const _fromDate = new Date(currentDate);
	_fromDate.setDate(currentDate.getDate() - daysToSubtract);
	const fromDate = _fromDate.setHours(0, 0, 0, 0);

	// Calculate toDate by adding the days to get to Sunday
	const _toDate = new Date(_fromDate);
	_toDate.setDate(_fromDate.getDate() + 6);
	const toDate = _toDate.setHours(24, 0, 0, 0);

	return {
		fromDate,
		toDate 
	};
};

export const getDailyQuestDates = () => {
	const fromDate = new Date().setHours(0, 0, 0, 0);
	const toDate = new Date().setHours(24, 0, 0, 0);

	return {
		fromDate,
		toDate 
	};
};