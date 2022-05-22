// import axios from "axios";
// import { GOOGLE_ANALYTICS4_PROPERTY_ID } from "environment";

// export type GAEventProps = {
//     category: string;
//     action: string;
//     label: string;
//     value?: number;
// }
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