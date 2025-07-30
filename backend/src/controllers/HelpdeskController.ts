import HelpdeskHeaderModel from "../models/helpdesk/HelpdeskHeader";
import HelpdeskDetailsModel from "../models/helpdesk/HelpdeskDetails";
import HelpdeskCcModel from "../models/helpdesk/HelpdeskCc";
import HelpdeskNoteModel from "../models/helpdesk/HelpdeskNote";
import HelpdeskNotifModel from "../models/helpdesk/HelpdeskNotif";
import { deleteFile } from "../FileHandler";
import prisma from "../PrismaConnection";
import BagianMaster from "../models/master/BagianMaster";
import User from "../models/master/User";
import HelpdeskNoteJobRegModel from "../models/helpdesk/HelpdeskNoteJobReg";

// Function to recreate Helpdesk Header Model object together with all it's dependent class to make sure all instances are getting properties
// and methods of its class. Force casting with "as" keyword will not make the object gets all properties and methods of the casted class.
function convertToHelpdeskHeaderModel(data: HelpdeskHeaderModel) {
	const helpdeskHeaderData = new HelpdeskHeaderModel(data.nomor, data.title, data.tipe, data.prioritas, data.dari, data.kepada, data.tanggalTerbit, data.status);
	helpdeskHeaderData.pertimbangan = data.pertimbangan;
	helpdeskHeaderData.tanggalTerima = data.tanggalTerima;
	helpdeskHeaderData.tanggalSelesai = data.tanggalSelesai;
	helpdeskHeaderData.namaFile = data.namaFile;
	helpdeskHeaderData.namaFileKepada = data.namaFileKepada;

	helpdeskHeaderData.detailsList.push(...convertToHelpdeskDetailsModelList(data.detailsList));
	helpdeskHeaderData.ccList.push(...data.ccList.map(cc => new HelpdeskCcModel(cc.linenum, cc.cc, cc.ac, cc.tanggalAc, cc.pic, cc.namaFile)));

	return helpdeskHeaderData;
}

async function getMentionsToBeRemovedList(username: string) {
	const bagianList = await BagianMaster.getBagianMasterList();
	const userList = await User.getUserList();
	const mentionsToBeRemoved: string[] = [];

	if ((userList.find(user => user.username === username)?.lvl.length || 0) > 0) {
		mentionsToBeRemoved.push(username.substring(0, 4));
		let lowerLevel = userList.filter(user => user.superior === username);
		while (true) {
			mentionsToBeRemoved.push(...lowerLevel.filter(user => !mentionsToBeRemoved.includes(user.lvl.length > 0 ? user.username.substring(0, 4) : user.username)).map(user => user.lvl.length > 0 ? user.username.substring(0, 4) : user.username))
			lowerLevel = userList.filter(user => lowerLevel.map(user => user.username).includes(user.superior));
			if (lowerLevel.length <= 0)
				break;
		}
	} else {
		mentionsToBeRemoved.push(username);
	}

	return mentionsToBeRemoved;
}

// Function to recreate Helpdesk Details Model object from a list of Helpdesk Details Model received from client's request to make sure
// every instance have all properties defined for its instances. (force casting using "as" keyword sometimes not working well as all method
// from the class is not defined and making the method undefined and can't be invoke for those instances)
function convertToHelpdeskDetailsModelList(data: HelpdeskDetailsModel[]) {
	return data.map(details => {
		const newDetails = new HelpdeskDetailsModel(details.linenum, details.order, details.jumlah, details.keterangan, details.status, details.noAktiva, details.remarks, details.pic, details.tanggalTerima, details.ts, details.tanggalSelesai);
		newDetails.noteList.push(...convertToHelpdeskNoteJobRegModelList(details.noteList));
		return newDetails;
	});
}

function convertToHelpdeskNoteJobRegModelList(data: HelpdeskNoteJobRegModel[]) {
	return data.map(note => new HelpdeskNoteJobRegModel(note.linenum, note.tanggal, note.username, note.comment));
}

export default {
	// Function to retrieve list of helpdesk data based on client's logged in user and helpdesk category. 
  getHelpdeskList: async (username: string, type: string) => {
		return HelpdeskHeaderModel.getHelpdeskListBySelection(username, type);
	},

	// Function to retrieve notification list that contains notification from other applications and several helpdesk categories that needs to update
	// its state or amount of helpdesk needs action.
	getNotificationList: async (username: string) => {
		return HelpdeskHeaderModel.getNotificationList(username);
	},

	// Function to retrieve helpdesk data by passing the helpdesk number as parameter. 
	getHelpdeskByNumber: async (nomor: string) => {
		return HelpdeskHeaderModel.getHelpdeskByNumber(nomor);
	},

	// All insert and update operations of helpdesk that includes the operations on its dependent data, like helpdesk details (job registration),
	// helpdesk CC, and notes will be executed under transaction, so if some errors occur during the insertion or update, the transaction will rollback,
	// and the executed query will be canceled to keep the reliability of the data.

	// Function to create new helpdesk data by inserting the HelpdeskHeader data together with all of its dependent data like
	// helpdesk details (job registration), CC.
	createHelpdesk: async (data: HelpdeskHeaderModel) => {
		return prisma.$transaction(async (tx) => {
			// Generate the latest number for newly created helpdesk.
			data.nomor = await HelpdeskHeaderModel.generateLatestNumber(data.dari.substring(0, 4));

			// Converting the data coming from client request to a valid data Model initialized by class in this project.
			const helpdeskHeaderData = convertToHelpdeskHeaderModel(data);

			// Insert the converted helpdesk header data to database.
			await helpdeskHeaderData.insertHeader(tx);

			// Bulk insert converted helpdesk details and CCs data to database. (No deletion needed because the helpdesk with current number is created on the first time.)
			await HelpdeskDetailsModel.bulkInsertDetails(helpdeskHeaderData.nomor, helpdeskHeaderData.detailsList, tx);
			await HelpdeskCcModel.bulkInsertCc(helpdeskHeaderData.nomor, helpdeskHeaderData.ccList, tx);

			// Return the helpdesk number generated before back to the client for informational matter.
			return helpdeskHeaderData.nomor;
		});
	},

	// Function to update existing helpdesk data. The function wlll first check all inserted CC data in the table, and will remove files uploaded by 
	// all CC that is not existed on the new CC to keep the storage optimized. Then the HelpdeskHeader data will be updated, followed by bulk delete 
	// of details and CC data, and bulk insertion of details and cc data. Additionally, if note is provided by client while updating helpdesk, will be
	// insert into the table with no deletion of the note before (note will stay persistent inside database).
 	reviseHelpdesk: async (data: HelpdeskHeaderModel, note: HelpdeskNoteModel) => {
		// Convert received data from client to valid data Model.
		const helpdeskHeaderData = convertToHelpdeskHeaderModel(data);

		// Get current helpdesk previous data for comparison and other use.
		const oldHelpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(data.nomor);

		// Delete all CC files for CCs that were exist before and already relocated or not include in the CC list of the updated helpdesk.
		for (const cc of oldHelpdesk.ccList) {
			const newCc = helpdeskHeaderData.ccList.find(cc2 => cc2.linenum === cc.linenum);
			if (newCc?.cc !== cc.cc && cc.namaFile.length) {
				await deleteFile("helpdesk", helpdeskHeaderData.nomor, cc.namaFile);
			}
		}

		return prisma.$transaction(async (tx) => {
			// Update helpdesk header data with the latest data sent by client. 
			await helpdeskHeaderData.updateHeader(tx);

			// Delete all previously stored Helpdesk Details data and replace them with the new ones.
			await HelpdeskDetailsModel.bulkDeleteDetails(data.nomor, tx);
			await HelpdeskDetailsModel.bulkInsertDetails(data.nomor, helpdeskHeaderData.detailsList, tx);

			// Delete all previously stored Helpdesk CC data and replace them with the new ones.
			await HelpdeskCcModel.bulkDeleteCc(data.nomor, tx);
			await HelpdeskCcModel.bulkInsertCc(data.nomor, helpdeskHeaderData.ccList, tx);

			// Generate a new line number for note
			// If user wrote a note when doing revision to the helpdesk, then it will create a new Note containing the note written by user. 
			let linenum = await HelpdeskNoteModel.generateLatestNumber(data.nomor);
			if (note.comment.length > 0) {
				const newNote = new HelpdeskNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
				await newNote.insertNote(data.nomor, tx);
				linenum++;
			}

			// Create a new note generated automatically to mark that a revision for current helpdesk has been done by user.
			const noteLog = new HelpdeskNoteModel(linenum, new Date(), helpdeskHeaderData.dari, "revision_done", []);
			await noteLog.insertNote(data.nomor, tx);

			// Create notification data to notify some users that neccesary to know the revision has been done by helpdesk publisher,
			// only for CC user in the current helpdesk with already given feedback.
			const notifList: HelpdeskNotifModel[] = [];
			helpdeskHeaderData.ccList.filter(cc => cc.ac === "APPROVE").forEach(cc => 
				notifList.push(new HelpdeskNotifModel(cc.cc.length === 4 ? cc.cc.concat("-01") : cc.cc, "revision_done"))
			);
			if (notifList.length > 0) {
				// Delete all notifications for the current helpdesk and insert new notification for every dedicated user.
				await HelpdeskNotifModel.bulkDeleteNotif(data.nomor, tx);
				await HelpdeskNotifModel.bulkInsertNotif(data.nomor, notifList, tx);
			}
		});
	},

	updateHelpdeskNote: async (nomor: string, type: string, note: HelpdeskNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current helpdesk data stored inside database.
			const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);

			if (type === "reply-for-revision") {
				// Change helpdesk status to PUBLISHED if there are no CCs that has not give APPROVE feedback for the helpdesk
				if (!helpdesk.ccList.find(cc => cc.ac !== "APPROVE"))
					helpdesk.status = "PUBLISHED";
				else {
					// Reset helpdesk status back to UNPUBLISHED and CC asked for revision back to NO ACTION
					helpdesk.status = "UNPUBLISHED";
					const revisionCc = helpdesk.ccList.find(cc => cc.ac === "REVISION");
					if (revisionCc)
						revisionCc.ac = "NO ACTION";
					revisionCc?.updateCc(helpdesk.nomor, tx);
				}
				// Update helpdesk header according to the defined status before.
				helpdesk.updateHeader(tx);
	
			} else if (type === "reply-for-review") {
				// Get the latest mention note with some mentioned users not yet give their reply for review.
				const requestReviewNoteList = helpdesk.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
				const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];

				// Get all users or bagian / divisions / departments mentioned that will be removed because of the reply sent by their higher level
				// user which also being mentioned, and update the note to remove that list of mentioned to be remove from the column in database.
				const mentionsToBeRemoved: string[] = await getMentionsToBeRemovedList(note.username);
				const updatedNote = new HelpdeskNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
				updatedNote.updateNote(nomor, tx);

				// If all mentions have commented to the helpdesk for review asked by a CC, then it will change the CC respond back to 
				// NO ACTION to indicate that the requested review has been given by all mentioned users.
				if (updatedNote.mentions.length <= 0) {
					const updatedCc = helpdesk.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
					if (updatedCc) {
						updatedCc.ac = "NO ACTION";
						updatedCc.updateCc(nomor, tx);
					}
				}
				
			} else if (type === "follow-up") {
				await HelpdeskNotifModel.bulkDeleteNotif(nomor, tx);
				await HelpdeskNotifModel.bulkInsertNotif(nomor, [new HelpdeskNotifModel(helpdesk.kepada.concat("-01"), "follow_up")], tx);

			}

			const linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			const newNote = new HelpdeskNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
			await newNote.insertNote(nomor, tx);

			if (type === "reply-for-revision") {
				const noteLog = new HelpdeskNoteModel(linenum + 1, new Date(), note.username, "reply_revision_done", []);
				await noteLog.insertNote(nomor, tx);
			}
		})
	},

	// Function to update helpdesk status back to CC or recipient which have to be GMG, and usually comes from a reply message from
	// div / dept head to response to GMG comments or questions regarding the helpdesk open by themselves or their lower level staff.
	updateHelpdeskReplyComment: async (nomor: string, note: HelpdeskNoteModel) => {
		// Get current helpdesk previous data for comparison and other use.
		const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);

		return prisma.$transaction(async (tx) => {
			// Change helpdesk status to PUBLISHED if there are no CCs that has not give APPROVE feedback for the helpdesk
			if (!helpdesk.ccList.find(cc => cc.ac !== "APPROVE"))
				helpdesk.status = "PUBLISHED";
			else {
				// Reset helpdesk status back to UNPUBLISHED and CC asked for revision back to NO ACTION
				helpdesk.status = "UNPUBLISHED";
				const revisionCc = helpdesk.ccList.find(cc => cc.ac === "REVISION");
				if (revisionCc)
					revisionCc.ac = "NO ACTION";
				revisionCc?.updateCc(helpdesk.nomor, tx);
			}

			// Update helpdesk header according to the defined status before.
			helpdesk.updateHeader(tx);

			// Generate a new line number for note
			// Create a new Note containing the note written by user and also generate a note to mark that a reply has been given by publisher's highest
			// bagian / divisions / departments to respond to REVISION feedback given by MGMG.
			const linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			const newNote = new HelpdeskNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
			await newNote.insertNote(nomor, tx);

			const noteLog = new HelpdeskNoteModel(linenum + 1, new Date(), note.username, "reply_revision_done", []);
			await noteLog.insertNote(nomor, tx);
		})
	},

	// Function to update CC information and helpdesk status if the updated CC feedback affecting helpdesk status, by updating the specific CC
	// record, checking if it will affecting the status of helpdesk and will make a change to the status if neccessary.
	updateCcFeedback: async (nomor: string, data: HelpdeskCcModel, note: HelpdeskNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current helpdesk data stored inside database.
			const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);

			// Create a new model of Helpdesk CC to convert the raw data
			const updatedCc = new HelpdeskCcModel(data.linenum, data.cc, data.ac, data.tanggalAc, data.pic, data.namaFile);

			// If the feedback given is REQUESTING REVIEW and it is from GMG, then this block of codes will be executed.
			// GMG is the special case of REQUESTING REVIEW feedback as she could add new CC automatically if she has mentioned
			// bagian / divisions / departments not in the CC list.
			if (updatedCc.ac === "REQUESTING REVIEW" && updatedCc.cc === "MGMG") {
				const bagianList = await BagianMaster.getBagianMasterList();
				const userList = await User.getUserListAdjustedSuperior();
				let mentions = [...note.mentions];
				let extraAddedMentionsCount = 0;
				const additionalCc: HelpdeskCcModel[] = [];
				
				note.mentions.forEach((mention, index) => {
					const additionalMentions: string[] = [];

					// If the mentioned users is not exist in the CC list, then it will automatically be added to the list
					if (!helpdesk.ccList.find(cc => cc.cc === mention))
						additionalCc.push(new HelpdeskCcModel(additionalCc.length, mention, "NO ACTION"));

					// Also for every mentioned users, it will be traverse up to the level right under GMG to identify every upper level of the mentioned users,
					// and if there is no mention to the upper level, it will be added. And if the CC also not exist, then it will be added, too.
					let currentLvl = mention.length === 4 ? mention : userList.find(user => user.username === mention)?.superior.substring(0, 4);

					while (currentLvl && currentLvl !== "MGMG") {
						const upperBagian = bagianList.find(bagian => bagian.code === currentLvl);
						if (upperBagian && !mentions.find(bagianCode => bagianCode === upperBagian.code) && !additionalMentions.find(bagianCode => bagianCode === upperBagian.code))
							additionalMentions.push(upperBagian.code);
						if (upperBagian && !helpdesk.ccList.find(cc => cc.cc === upperBagian.code) && !additionalCc.find(cc => cc.cc === upperBagian.code))
							additionalCc.push(new HelpdeskCcModel(additionalCc.length, upperBagian.code, "NO ACTION"));
						currentLvl = userList.find(user => user.username === (currentLvl + "-01"))?.superior.substring(0, 4);
					}

					// If additional mentions exist (mentions to upper bagian of the current mention is added on the previous process), then it will be append inside the
					// comment, so it will be updated automatically.
					if (additionalMentions.length > 0) {
						mentions = [...mentions.slice(index + extraAddedMentionsCount, index + extraAddedMentionsCount + 1), ...additionalMentions, ...mentions.slice(index + extraAddedMentionsCount + 1)];
						note.comment = note.comment.substring(0, note.comment.indexOf("@" + mention + "!") + mention.length + 3) + additionalMentions.map(mentioned => "@" + mentioned + "! (added by system) ").join(" ") + note.comment.substring(note.comment.indexOf("@" + mention + "!") + mention.length + 3);
						extraAddedMentionsCount += additionalMentions.length;
					}
				});

				note.mentions = mentions;
				if (additionalCc.length > 0) {
					// Insert additional CC in the middle of the CC list between previously approved CC and current CC (GMG)
					let ccList = [...helpdesk.ccList];
					ccList[data.linenum] = updatedCc;
					const ccBeforeGMG = ccList.slice(0, data.linenum);
					additionalCc.forEach((cc, index) => {
						cc.linenum = ccBeforeGMG.length + index;
					})
					const ccGMGAndAfter = ccList.slice(data.linenum);
					ccGMGAndAfter.forEach((cc, index) => {
						cc.linenum = ccBeforeGMG.length + additionalCc.length + index;
					})
					ccList = [...ccBeforeGMG, ...additionalCc, ...ccGMGAndAfter];

					// CC list of the current helpdesk will be removed, then will be inserted back with new updated list.
					await HelpdeskCcModel.bulkDeleteCc(helpdesk.nomor, tx);
					await HelpdeskCcModel.bulkInsertCc(helpdesk.nomor, ccList, tx);

				} else {
					await updatedCc.updateCc(helpdesk.nomor, tx);
				}
				
			} else {
				// If the current CC is the last CC and the feedback is APPROVE, then helpdesk will automatically be published to the recipient, the status of the helpdesk
				// will become PUBLISHED, and the received date will be updated. If current CC give a REVISION feedback, then the helpdesk will be send back to publisher
				// and the status will become REVISION. If the feedback is REJECT, then the helpdesk will automatically be closed, the status will become REJECTED, and no
				// progress could be made to the helpdesk anymore.
				if (updatedCc.ac === "APPROVE" && helpdesk.ccList[helpdesk.ccList.length - 1].linenum === updatedCc.linenum) {
					helpdesk.status = "PUBLISHED";
					helpdesk.tanggalTerima = new Date();
				} 
				else if (updatedCc.ac === "REVISION")
					helpdesk.status = "REVISION";
				else if (updatedCc.ac === "REJECT")
					helpdesk.status = "REJECTED";
	
				// Update current helpdesk with changed status
				// Also update the current CC feedback
				await helpdesk.updateHeader(tx);
				await updatedCc.updateCc(helpdesk.nomor, tx);

				const requestReviewNoteList = helpdesk.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
				const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];
				if (helpdesk.ccList.find(cc => cc.linenum === updatedCc.linenum)?.ac === "REQUESTING REVIEW") {
					const updatedNote = new HelpdeskNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, []);
					updatedNote.updateNote(nomor, tx);
				} else if (helpdesk.ccList.find(cc => cc.ac === "REQUESTING REVIEW") && lastRequestReview.mentions.find(mention => mention === updatedCc.cc) && note.comment.length > 0) {
					const mentionsToBeRemoved = await getMentionsToBeRemovedList(note.username);
					const updatedNote = new HelpdeskNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
					updatedNote.updateNote(nomor, tx);

					if (updatedNote.mentions.length <= 0) {
						const updatedCcRequestingReview = helpdesk.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
						if (updatedCcRequestingReview) {
							updatedCcRequestingReview.ac = "NO ACTION";
							updatedCcRequestingReview.updateCc(nomor, tx);
						}
					}
				}
			}
			
			// Generate a new line number for note			
			// If user wrote a note when giving the feedback, then it will create a new Note containing the note written by user. 
			let linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			if (note.comment.length > 0) {
				const newNote = new HelpdeskNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
				await newNote.insertNote(helpdesk.nomor, tx);
				linenum++;
			}

			if (["APPROVE", "REVISION", "REJECT", "REQUESTING REVIEW"].includes(updatedCc.ac)) {
				// A new note will be inserted into database if either REVISION, REJECT, or REQUESTING REVIEW feedback was given by the CC to mark the response.
				const mentions = updatedCc.ac === "REQUESTING REVIEW" ? (updatedCc.cc === "MGMG" ? note.mentions : note.mentions.filter(mention => helpdesk.ccList.map(cc => cc.cc).includes(mention))) : [];
				const noteLog = new HelpdeskNoteModel(linenum, new Date(), updatedCc.cc, (updatedCc.ac === "APPROVE" ? "approved_cc" : updatedCc.ac === "REVISION" ? "revision_cc" : updatedCc.ac === "REJECT" ? "rejected_cc" : "requesting_review_cc") + (updatedCc.linenum + 1), mentions);
				await noteLog.insertNote(nomor, tx);

				// If GMG give REVISION or REJECT feedback for current helpdesk, it will be notified to every CC before GMG that have granted the publish of the helpdesk.
				if (updatedCc.cc === "MGMG" && ["REVISION", "REJECT"].includes(updatedCc.ac)) {
					const helpdeskNotifList: HelpdeskNotifModel[] = [];
					helpdesk.ccList.filter(cc => cc.linenum < updatedCc.linenum).forEach(cc => 
						helpdeskNotifList.push(new HelpdeskNotifModel(cc.cc.length === 4 ? cc.cc.concat("-01") : cc.cc, updatedCc.ac === "REVISION" ? "revision_from_gmg" : "rejected_from_gmg"))
					);

					// Delete all remaining and unread notification of current helpdesk and replace it with the new one, for all specified users.
					await HelpdeskNotifModel.bulkDeleteNotif(helpdesk.nomor, tx);
					await HelpdeskNotifModel.bulkInsertNotif(helpdesk.nomor, helpdeskNotifList, tx);
				}
			}
		});
	},

	// Function to reply to the CC whose requesting for review to the user. It will remove the user from the mentioned list as it is considered reviewed by
	// the user.
	replyForReview: async (nomor: string, note: HelpdeskNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current helpdesk data stored inside database.
			const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);

			// Get the latest mention note with some mentioned users not yet give their reply for review.
			const requestReviewNoteList = helpdesk.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
			const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];

			// Get all users or bagian / divisions / departments mentioned that will be removed because of the reply sent by their higher level
			// user which also being mentioned, and update the note to remove that list of mentioned to be remove from the column in database.
			const mentionsToBeRemoved: string[] = await getMentionsToBeRemovedList(note.username);
			const updatedNote = new HelpdeskNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
			updatedNote.updateNote(nomor, tx);

			// If all mentions have commented to the helpdesk for review asked by a CC, then it will change the CC respond back to 
			// NO ACTION to indicate that the requested review has been given by all mentioned users.
			if (updatedNote.mentions.length <= 0) {
				const updatedCc = helpdesk.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
				if (updatedCc) {
					updatedCc.ac = "NO ACTION";
					updatedCc.updateCc(nomor, tx);
				}
			}
			
			// Generate a new line number for note
			// Create a new Note containing the note written by user
			const linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			const noteLog = new HelpdeskNoteModel(linenum, new Date(), note.username, note.comment, []);
			await noteLog.insertNote(nomor, tx);
		});
	},

	// Function to update all job registration, feedback from recipient, complimentary file, and additional notes sent by client as recipient of
	// a helpdesk. The function will get the object of the helpdesk, updating its feedback and feedback file name if one is present, deleting all existing
	// records of helpdesk details and inserting the new and updated job registration, and also adding a new note if one is present. 
	updateFeedback: async (nomor: string, feedback: string, namaFileKepada: string, detailsList: HelpdeskDetailsModel[], note: HelpdeskNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current helpdesk data stored inside database.
			const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);
	
			// Changing helpdesk status according to recipient's feedback, and if not provided, will use the current status.
			// Also tracks if there is a file uploaded by recipient, and change the finished date of helpdesk if it is marked done by recipient.
			helpdesk.status = feedback.length > 0 ? feedback : helpdesk.status;
			if (feedback === "DONE")
				helpdesk.tanggalSelesai = new Date();
			helpdesk.namaFileKepada = namaFileKepada;
			
			// Update current helpdesk with changed status
			await helpdesk.updateHeader(tx);

			// Delete all helpdesk details (job registration) data and insert the status-updated job registration data.
			const convertedDetailsList = convertToHelpdeskDetailsModelList(detailsList);
			await HelpdeskDetailsModel.bulkDeleteDetails(nomor, tx);
			await HelpdeskDetailsModel.bulkInsertDetails(nomor, convertedDetailsList, tx);
			for (const details of convertedDetailsList)
				await HelpdeskNoteJobRegModel.bulkInsertNote(nomor, details.linenum, details.noteList, tx);
			

			// Generate a new line number for note			
			// If user wrote a note when giving feedback to the helpdesk, then it will create a new Note containing the note written by user. 
			let linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			if (note.comment.length > 0) {
				const newNote = new HelpdeskNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
				await newNote.insertNote(helpdesk.nomor, tx);
				linenum++;
			}

			if (["REVISION", "REJECTED"].includes(feedback)) {
				// If helpdesk recipient gave REVISION or REJECTED feedback, then it will be recorded into database through a note
				const noteLog = new HelpdeskNoteModel(linenum, new Date(), helpdesk.kepada, feedback === "REVISION" ? "revision_recipient" : "rejected_recipient", []);
				await noteLog.insertNote(nomor, tx);
			}
		});
	},

	// Function to update all job registration from one helpdesk by delete all existing records of helpdesk details and insert the new and updated
	// job registration.
	updateJobRegistration: async (nomor: string, detailsList: HelpdeskDetailsModel[]) => {
		return prisma.$transaction(async (tx) => {
			// Updating job registratoin will be done by bulk delete and insert to ensure all job registration data are updated.
			const convertedDetailsList = convertToHelpdeskDetailsModelList(detailsList);
			await HelpdeskDetailsModel.bulkDeleteDetails(nomor, tx);
			await HelpdeskDetailsModel.bulkInsertDetails(nomor, convertedDetailsList, tx);
			for (const details of convertedDetailsList)
				await HelpdeskNoteJobRegModel.bulkInsertNote(nomor, details.linenum, details.noteList, tx);
		});
	},

	// Function to reopen already-done helpdesk by changing its status back to PUBLISHED and reset all the progress of job registration (helpdesk details)
	// from DONE back to WAITING.
	reopenHelpdesk: async (nomor: string, role: string) => {
		return prisma.$transaction(async (tx) => {
			// Get current helpdesk data stored inside database.
			const helpdesk = await HelpdeskHeaderModel.getHelpdeskByNumber(nomor);
	
			// Change the status of the helpdesk back to PUBLISHED and all of its Job Registration back to WAITING.
			helpdesk.status = "PUBLISHED";
			helpdesk.tanggalSelesai = new Date("1900-01-01");
			helpdesk.detailsList.forEach(details => {
				details.status = "WAITING";
				details.tanggalSelesai = new Date("1900-01-01");
			});

			// Update current helpdesk with changed status
			await helpdesk.updateHeader(tx);

			// Delete all helpdesk details (job registration) data and insert the status-updated job registration data.
			await HelpdeskDetailsModel.bulkDeleteDetails(nomor, tx);
			await HelpdeskDetailsModel.bulkInsertDetails(nomor, helpdesk.detailsList, tx);

			// Create a note to mark that an attempt to re-open closed helpdesk has been made.
			const linenum = await HelpdeskNoteModel.generateLatestNumber(nomor);
			const noteLog = new HelpdeskNoteModel(linenum, new Date(), role === "publisher" ? helpdesk.dari : role === "recipient" ? helpdesk.kepada : (helpdesk.ccList.find(cc => cc.linenum === Number(role.substring(2)))?.cc || ""), `reopen_${role}`, []);
			await noteLog.insertNote(nomor, tx);
		});
	},

	// Function to remove notification from a user for specific helpdesk. 
	deleteNotification: async (nomor: string, username: string) => {
		return HelpdeskNotifModel.deleteNotif(nomor, username);
	}
};
