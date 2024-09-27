import mongoose from 'mongoose';

const connectDB = async () => {
	try {
		if(mongoose.connection.readyState === 1) {
			console.log('Database already connected !');
			return;
		}
		console.log('Trying to connecting Database !');
		await mongoose.connect(
			`mongodb://mongo:YNIaIFwzTLKQOnEUHtnbiGmrIAjlJVhp@autorack.proxy.rlwy.net:34097`
		);
		console.log('Connected Database !');
	} catch (error: any) {
		console.log(error.message);
		throw error;
	}
};

export default connectDB;
