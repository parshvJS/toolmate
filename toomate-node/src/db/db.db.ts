import mongoose from 'mongoose';
let retryCount = 15;
const connectDB = async () => {
	try {
		if (mongoose.connection.readyState === 1) {
			console.log('Database already connected !');
			return;
		}
		console.log('Trying to connecting Database !');
		await mongoose.connect(
			`mongodb+srv://jsparshv:ParshvJS@symplife.hm1gt.mongodb.net/?retryWrites=true&w=majority&appName=sympLife`
		);
		console.log('Connected Database !');
	} catch (error: any) {
		if (retryCount > 0) {
			console.log('Retrying to connect database !');
			setTimeout(async () => {
				await connectDB();
			}, 5000);
			retryCount--;
			return;
		}

	}
};

export default connectDB;
