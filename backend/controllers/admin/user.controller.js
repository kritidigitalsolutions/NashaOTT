const User = require("../../models/user.model");
const Subscription = require("../../models/subscription.model");
const Watchlist = require("../../models/watchlist.model");
const Rating = require("../../models/rating.model");
const Interaction = require("../../models/interaction.model");
const SupportTicket = require("../../models/supportTicket.model");
const SupportMessage = require("../../models/supportMessage.model");
const Voucher = require("../../models/voucher.model");
const Notification = require("../../models/notification.model");
const PaymentTransaction = require("../../models/paymentTransaction.model");
const Movie = require("../../models/movie.model");
const Series = require("../../models/series.model");


// ========================================
// CASCADE DELETION HELPER
// ========================================
const performCascadeDeleteForUsers = async (userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
        // 1. Find support tickets, then delete their support messages
        const tickets = await SupportTicket.find({ user: { $in: userIds } }).select("_id").lean();
        const ticketIds = tickets.map(t => t._id);
        if (ticketIds.length > 0) {
            await SupportMessage.deleteMany({ ticket: { $in: ticketIds } });
        }
        await SupportTicket.deleteMany({ user: { $in: userIds } });

        // 2. Delete Watchlists, Subscriptions, Payments, Ratings, Interactions, target notifications
        await Promise.all([
            Watchlist.deleteMany({ user: { $in: userIds } }),
            Subscription.deleteMany({ user: { $in: userIds } }),
            PaymentTransaction.deleteMany({ user: { $in: userIds } }),
            Rating.deleteMany({ user: { $in: userIds } }),
            Interaction.deleteMany({ user: { $in: userIds } }),
            Notification.deleteMany({ targetUser: { $in: userIds } }),
        ]);

        // 3. Release/Reset Vouchers used by these users
        await Voucher.updateMany(
            { usedBy: { $in: userIds } },
            { $set: { isUsed: false, usedBy: null } }
        );

        // 4. Pull user IDs from Movie, Series, and Notification tracking arrays
        await Promise.all([
            Movie.updateMany(
                {},
                { $pull: { likes: { $in: userIds }, dislikes: { $in: userIds } } }
            ),
            Series.updateMany(
                {},
                { $pull: { likes: { $in: userIds }, dislikes: { $in: userIds } } }
            ),
            Notification.updateMany(
                {},
                { $pull: { readBy: { user: { $in: userIds } }, deletedBy: { user: { $in: userIds } } } }
            ),
        ]);
    } catch (err) {
        console.error("Cascade deletion error:", err);
    }
};


// ========================================
// GET ALL USERS (with optional search, pagination and stats)
// ========================================
exports.getAllUsers = async (
    req,
    res
) => {
    try {
        const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : null;
        const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit)) : null;
        const q = req.query.q;

        let query = {};

        if (q) {
            const regex = new RegExp(q, "i");
            query = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { phone: regex }
                ]
            };
        }

        let dbQuery = User.find(query)
            .select("-__v")
            .sort({ createdAt: -1 });

        if (page && limit) {
            const skip = (page - 1) * limit;
            dbQuery = dbQuery.skip(skip).limit(limit);
        }

        const [users, totalCount, blockedCount] = await Promise.all([
            dbQuery.lean(),
            User.countDocuments(query),
            User.countDocuments({ ...query, isBlocked: true })
        ]);

        const activeCount = totalCount - blockedCount;

        const responsePayload = {
            success: true,
            users,
            totalCount,
            activeCount,
            blockedCount,
        };

        if (page && limit) {
            responsePayload.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit,
                hasNextPage: page * limit < totalCount,
                hasPrevPage: page > 1,
            };
        }

        res.status(200).json(responsePayload);

    } catch (error) {
        console.error(
            "Get Users Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


exports.getSingleUser = async (
    req,
    res
) => {
    try {
        const user = await User.findById(
            req.params.id
        ).select("-__v");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error(
            "Get Single User Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// ========================================
// DELETE ALL USERS
// ========================================
exports.deleteAllUsers = async (req, res) => {
    try {
        const allUsers = await User.find({}).select("_id").lean();
        const allUserIds = allUsers.map(u => u._id);

        await performCascadeDeleteForUsers(allUserIds);
        await User.deleteMany({});

        res.status(200).json({
            success: true,
            message: "All users and related data deleted successfully",
        });

    } catch (error) {
        console.error("Delete All Users Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// ========================================
// TOGGLE BLOCK USER
// ========================================
exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
            user,
        });
    } catch (error) {
        console.error("Toggle Block Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// ========================================
// DELETE USER
// ========================================
exports.deleteUser = async (
    req,
    res
) => {
    try {
        const user = await User.findById(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await performCascadeDeleteForUsers([req.params.id]);
        await User.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "User and related data deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete User Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


exports.getRegistrationStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const [todayCount, yesterdayCount, totalCount] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            User.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),
            User.countDocuments({}),
        ]);

        res.status(200).json({
            success: true,
            data: {
                todayRegistration: todayCount,
                yesterdayRegistration: yesterdayCount,
                totalRegistration: totalCount,
            },
        });
    } catch (error) {
        console.error("Get Registration Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


exports.getUserGrowth = async (req, res) => {
    try {
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const growthData = [];

        // Loop for the last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const count = await User.countDocuments({
                createdAt: { $gte: d, $lt: nextD },
            });

            growthData.push({
                day: daysOfWeek[d.getDay()],
                users: count,
            });
        }

        res.status(200).json({
            success: true,
            data: growthData,
        });
    } catch (error) {
        console.error("Get User Growth Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
