import axios from "axios";
import { GA4_API_SECRET, GA4_MEASUREMENT_ID } from "environment";
import loggers from "loggers";
// import { GOOGLE_ANALYTICS4_PROPERTY_ID } from "environment";

export type GA4EventProps = {
  category: string;
  action?: string;
  label?: string;
  value?: number;
  items?: any[];
};
// const trackEvent = async ({ category, action, label, value }: GAEventProps) => {
// 	try {
// 		const data = {
// 			ec: category,
// 			ea: action,
// 			el: label,
// 			t: "event",
// 			v: 1,
// 			tid: GOOGLE_ANALYTICS4_PROPERTY_ID,
// 			cid: "555" // dummy client id
// 		} as any;

// 		if (value) {
// 			data.ev = value;
// 		}
// 		console.log("parsed: ", data);

// 		await axios.post("http://www.google-analytics.com/collect", { data });
// 	} catch (err) {
// 		console.log("analytics error: ", err);
// 	}
// 	return;
// };

// export default trackEvent;

const GA4 = {
	_reportAnalytics: function (eventName: string, data: GA4EventProps) {
		if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET || !eventName || !data) return;
		// eslint-disable-next-line max-len
		const url = `https://google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;
		const body = {
			client_id: "dummy",
			events: [
				{
					name: eventName,
					params: data,
				},
			],
		};
		const bodyParams = JSON.stringify(body);
		loggers.info(
			"googleAnalytics._reportAnalytics: sending data - " + bodyParams
		);
		axios
			.post(url, bodyParams)
			.then(() => loggers.info("googleAnalytics._reportAnalytics: completed"))
			.catch((err) =>
				loggers.error("googleAnalytics._reportAnalytics: ERROR", err)
			);
	},
	trackPlayerActivity: function (item: { user_id: string; username: string; }) {
		try {
			loggers.info("GA4: sending 'user_activity' event");
			this._reportAnalytics("user_activity", {
				category: "daily_activity",
				action: "active",
				label: `${item.user_id}_${item.username}`
			});
			return;
		} catch (err) {
			loggers.error("googleAnalytics.trackPlayerActivity: Failed", err);
			return;
		}
	},
};

export default GA4;
