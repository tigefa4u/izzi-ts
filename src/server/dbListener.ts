import connection from "db/dbListenerConnection";


const boot = async () => {
	try {
		await connection.select("id").from("users").where({ id: 1 });
		console.log("App started");
	} catch (err) {
		console.log("error", err);
	}
};

boot();
