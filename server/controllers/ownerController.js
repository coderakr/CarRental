import imageKit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Cars.js";
import User from "../models/User.js";
import fs from "fs";

// API to change role
export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { role: "owner" });
    res.json({ success: true, message: "Now you can list cars" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to list car
// export const addCar = async (req, res) => {
//   try {
//     const { _id } = req.user;
//     // Guard clause
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Image file is required" });
//     }

//     let car = JSON.parse(req.body.carData);
//     const imageFile = req.file;

//     // upload image to imagekit
//     const fileBuffer = fs.readFileSync(imageFile.path);
//     const response = await imageKit.files.upload({
//       file: fileBuffer,
//       fileName: imageFile.originalname,
//       folder: "/cars",
//     });

//     // For URL Generation, work for both images and videos
//     // URL with basic transformations
//     const optimizedImageUrl = imageKit.helper.buildSrc({
//       src: response.filePath,
//       transformation: [
//         {
//           width: 1280,
//           quality: "auto",
//           format: "webp",
//         },
//       ],
//     });

//     const image = optimizedImageUrl;
//     await Car.create({ ...car, owner: _id, image });

//     res.json({ success: true, message: "car added" });
//   } catch (error) {
//     console.log(error.message);
//     res.json({ success: false, message: error.message });
//   }
// };

export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const car = JSON.parse(req.body.carData);

    const response = await imageKit.files.upload({
      file: fs.createReadStream(req.file.path),
      fileName: req.file.originalname,
      folder: "/cars",
    });

    const optimizedImageUrl = imageKit.helper.buildSrc({
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      src: response.filePath,
      transformation: [
        {
          width: 1280,
          quality: 80,
          format: "webp",
        },
      ],
    });

    await Car.create({
      ...car,
      owner: _id,
      image: optimizedImageUrl,
    });

    res.json({
      success: true,
      message: "Car added successfully",
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to list Owner Cars
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    res.json({ success: true, cars });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // checking is car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.isAvailable = !car.isAvailable;
    await car.save();
    res.json({ success: true, message: "Availability Toggled" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to Delete a Car
export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const cars = await Car.findById(carId);

    // checking is car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.owner = null;
    car.isAvailable = false;

    await car.save();
    res.json({ success: true, message: "car removed" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get Dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (role !== "owner") {
      return res.jons({ success: false, message: "unauthorized" });
    }

    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    const pendingBookings = await Booking.find({
      owner: _id,
      status: "pending",
    });

    const completedBookings = await Booking.find({
      owner: _id,
      status: "confirmed",
    });

    // calculate monthly revenue from bookings where status is confirmed
    const monthlyRevenue = bookings
      .slice()
      .filter((booking) => booking.status === "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings: completedBookings.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;

    const response = await imageKit.files.upload({
      file: fs.createReadStream(req.file.path),
      fileName: req.file.originalname,
      folder: "/users",
    });

    const optimizedImageUrl = imageKit.helper.buildSrc({
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      src: response.filePath,
      transformation: [
        {
          width: 400,
          quality: "auto",
          format: "webp",
        },
      ],
    });

    const image = optimizedImageUrl;

    await User.findByIdAndUpdate(_id, { image });
    res.json({ success: true, message: "Image updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
