import mongoose from 'mongoose';

const connectDB = async () => {
	try {
		if(mongoose.connection.readyState === 1) {
			console.log('Database already connected !');
			return;
		}
		console.log('Trying to connecting Database !');
		await mongoose.connect(
			`mongodb+srv://jsparshv:ParshvJS@symplife.hm1gt.mongodb.net/?retryWrites=true&w=majority&appName=sympLife`
		);
		console.log('Connected Database !');
	} catch (error: any) {
		console.log(error.message);
		throw error;
	}
};

export default connectDB;
