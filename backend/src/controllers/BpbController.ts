import { deleteFile } from "../FileHandler";
import BpbCcModel from "../models/bpb/BpbCc";
import BpbDetailsModel from "../models/bpb/BpbDetails";
import BpbHeaderModel from "../models/bpb/BpbHeader";
import BpbNoteModel from "../models/bpb/BpbNote";
import HelpdeskNotifModel from "../models/helpdesk/HelpdeskNotif";
import BagianMaster from "../models/master/BagianMaster";
import User from "../models/master/User";
import prisma from "../PrismaConnection";

function convertToBpbHeaderModel(data: BpbHeaderModel) {
	const bpbHeaderData = new BpbHeaderModel(data.nomor, data.dari, data.cardCode, data.kepada, data.status, data.tanggalTerbit);
	bpbHeaderData.keterangan = data.keterangan;
	bpbHeaderData.ref = data.ref;
	bpbHeaderData.tanggalSelesai = data.tanggalSelesai;
	bpbHeaderData.namaFile = data.namaFile;

	bpbHeaderData.detailsList.push(...data.detailsList.map(details => new BpbDetailsModel(details.linenum, details.qty, details.satuan, details.nama, details.wajibKembali, details.tsKembali)));
	bpbHeaderData.ccList.push(...data.ccList.map(cc => new BpbCcModel(cc.linenum, cc.cc, cc.ac, cc.tanggalAc, cc.pic, cc.namaFile)));

	return bpbHeaderData;
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

export default {
	// Function to retrieve list of BPB data based on client's logged in user and BPB category. 
  getBpbList: async (username: string, type: string) => {
		return BpbHeaderModel.getBpbListBySelection(username, type);
	},

	// Function to retrieve notification list that contains notification from other applications and several BPB categories that needs to update
	// its state or amount of BPB needs action.
	getNotificationList: async (username: string) => {
		return BpbHeaderModel.getNotificationList(username);
	},

	// Function to retrieve BPB data by passing the BPB number as parameter. 
	getBpbByNumber: async (nomor: string) => {
		return BpbHeaderModel.getBpbByNumber(nomor);
	},

	// All insert and update operations of BPB that includes the operations on its dependent data, like BPB details (job registration),
	// BPB CC, and notes will be executed under transaction, so if some errors occur during the insertion or update, the transaction will rollback,
	// and the executed query will be canceled to keep the reliability of the data.

	// Function to create new BPB data by inserting the BPB data together with all of its dependent data like
	// BPB details (job registration), CC.
	createBpb: async (data: BpbHeaderModel) => {
		return prisma.$transaction(async (tx) => {
			// Generate the latest number for newly created BPB.
			data.nomor = await BpbHeaderModel.generateLatestNumber(data.dari.substring(0, 4));

			// Converting the data coming from client request to a valid data Model initialized by class in this project.
			const bpbHeaderData = convertToBpbHeaderModel(data);

			// Insert the converted BPB header data to database.
			await bpbHeaderData.insertHeader(tx);

			// Bulk insert converted BPB details and CCs data to database. (No deletion needed because the BPB with current number is created on the first time.)
			await BpbDetailsModel.bulkInsertDetails(bpbHeaderData.nomor, bpbHeaderData.detailsList, tx);
			await BpbCcModel.bulkInsertCc(bpbHeaderData.nomor, bpbHeaderData.ccList, tx);

			// Return the BPB number generated before back to the client for informational matter.
			return bpbHeaderData.nomor;
		});
	},

	// Function to update existing BPB data. The function wlll first check all inserted CC data in the table, and will remove files uploaded by 
	// all CC that is not existed on the new CC to keep the storage optimized. Then the BPBHeader data will be updated, followed by bulk delete 
	// of details and CC data, and bulk insertion of details and cc data. Additionally, if note is provided by client while updating BPB, will be
	// insert into the table with no deletion of the note before (note will stay persistent inside database).
 	reviseBpb: async (data: BpbHeaderModel, note: BpbNoteModel) => {
		// Convert received data from client to valid data Model.
		const bpbHeaderData = convertToBpbHeaderModel(data);

		// Get current BPB previous data for comparison and other use.
		const oldBpb = await BpbHeaderModel.getBpbByNumber(data.nomor);

		// Delete all CC files for CCs that were exist before and already relocated or not include in the CC list of the updated BPB.
		for (const cc of oldBpb.ccList) {
			const newCc = bpbHeaderData.ccList.find(cc2 => cc2.linenum === cc.linenum);
			if (newCc?.cc !== cc.cc && cc.namaFile.length) {
				await deleteFile("bpb", bpbHeaderData.nomor, cc.namaFile);
			}
		}

		return prisma.$transaction(async (tx) => {
			// Update BPB header data with the latest data sent by client. 
			await bpbHeaderData.updateHeader(tx);

			// Delete all previously stored BPB Details data and replace them with the new ones.
			await BpbDetailsModel.bulkDeleteDetails(data.nomor, tx);
			await BpbDetailsModel.bulkInsertDetails(data.nomor, bpbHeaderData.detailsList, tx);

			// Delete all previously stored BPB CC data and replace them with the new ones.
			await BpbCcModel.bulkDeleteCc(data.nomor, tx);
			await BpbCcModel.bulkInsertCc(data.nomor, bpbHeaderData.ccList, tx);

			// Generate a new line number for note
			// If user wrote a note when doing revision to the BPB, then it will create a new Note containing the note written by user. 
			let linenum = await BpbNoteModel.generateLatestNumber(data.nomor);
			if (note.comment.length > 0) {
				const newNote = new BpbNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
				await newNote.insertNote(data.nomor, tx);
				linenum++;
			}

			// Create a new note generated automatically to mark that a revision for current BPB has been done by user.
			const noteLog = new BpbNoteModel(linenum, new Date(), bpbHeaderData.dari, "revision_done", []);
			await noteLog.insertNote(data.nomor, tx);

			// Create notification data to notify some users that neccesary to know the revision has been done by BPB publisher,
			// only for CC user in the current BPB with already given feedback.
			const notifList: HelpdeskNotifModel[] = [];
			bpbHeaderData.ccList.filter(cc => cc.ac === "APPROVE").forEach(cc => 
				notifList.push(new HelpdeskNotifModel(cc.cc.length === 4 ? cc.cc.concat("-01") : cc.cc, "revision_done"))
			);
			if (notifList.length > 0) {
				// Delete all notifications for the current BPB and insert new notification for every dedicated user.
				await HelpdeskNotifModel.bulkDeleteNotif(data.nomor, tx);
				await HelpdeskNotifModel.bulkInsertNotif(data.nomor, notifList, tx);
			}
		});
	},

	updateBpbNote: async (nomor: string, type: string, note: BpbNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current BPB data stored inside database.
			const bpb = await BpbHeaderModel.getBpbByNumber(nomor);

			if (type === "reply-for-revision") {
				// Change BPB status to PUBLISHED if there are no CCs that has not give APPROVE feedback for the BPB
				if (!bpb.ccList.find(cc => cc.ac !== "APPROVE"))
					bpb.status = "DONE";
				else {
					// Reset BPB status back to UNPUBLISHED and CC asked for revision back to NO ACTION
					bpb.status = "UNPUBLISHED";
					const revisionCc = bpb.ccList.find(cc => cc.ac === "REVISION");
					if (revisionCc)
						revisionCc.ac = "NO ACTION";
					revisionCc?.updateCc(bpb.nomor, tx);
				}
				// Update BPB header according to the defined status before.
				bpb.updateHeader(tx);
	
			} else if (type === "reply-for-review") {
				// Get the latest mention note with some mentioned users not yet give their reply for review.
				const requestReviewNoteList = bpb.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
				const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];

				// Get all users or bagian / divisions / departments mentioned that will be removed because of the reply sent by their higher level
				// user which also being mentioned, and update the note to remove that list of mentioned to be remove from the column in database.
				const mentionsToBeRemoved: string[] = await getMentionsToBeRemovedList(note.username);
				const updatedNote = new BpbNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
				updatedNote.updateNote(nomor, tx);

				// If all mentions have commented to the BPB for review asked by a CC, then it will change the CC respond back to 
				// NO ACTION to indicate that the requested review has been given by all mentioned users.
				if (updatedNote.mentions.length <= 0) {
					const updatedCc = bpb.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
					if (updatedCc) {
						updatedCc.ac = "NO ACTION";
						updatedCc.updateCc(nomor, tx);
					}
				}
				
			} else if (type === "follow-up") {
				await HelpdeskNotifModel.bulkDeleteNotif(nomor, tx);
				await HelpdeskNotifModel.bulkInsertNotif(nomor, [new HelpdeskNotifModel(bpb.kepada.concat("-01"), "follow_up")], tx);

			}

			const linenum = await BpbNoteModel.generateLatestNumber(nomor);
			const newNote = new BpbNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
			await newNote.insertNote(nomor, tx);

			if (type === "reply-for-revision") {
				const noteLog = new BpbNoteModel(linenum + 1, new Date(), note.username, "reply_revision_done", []);
				await noteLog.insertNote(nomor, tx);
			}
		})
	},

	// Function to update BPB status back to CC or recipient which have to be GMG, and usually comes from a reply message from
	// div / dept head to response to GMG comments or questions regarding the BPB open by themselves or their lower level staff.
	updateBpbReplyComment: async (nomor: string, note: BpbNoteModel) => {
		// Get current BPB previous data for comparison and other use.
		const bpb = await BpbHeaderModel.getBpbByNumber(nomor);

		return prisma.$transaction(async (tx) => {
			// Change BPB status to PUBLISHED if there are no CCs that has not give APPROVE feedback for the BPB
			if (!bpb.ccList.find(cc => cc.ac !== "APPROVE"))
				bpb.status = "DONE";
			else {
				// Reset BPB status back to UNPUBLISHED and CC asked for revision back to NO ACTION
				bpb.status = "UNPUBLISHED";
				const revisionCc = bpb.ccList.find(cc => cc.ac === "REVISION");
				if (revisionCc)
					revisionCc.ac = "NO ACTION";
				revisionCc?.updateCc(bpb.nomor, tx);
			}

			// Update BPB header according to the defined status before.
			bpb.updateHeader(tx);

			// Generate a new line number for note
			// Create a new Note containing the note written by user and also generate a note to mark that a reply has been given by publisher's highest
			// bagian / divisions / departments to respond to REVISION feedback given by MGMG.
			const linenum = await BpbNoteModel.generateLatestNumber(nomor);
			const newNote = new BpbNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
			await newNote.insertNote(nomor, tx);

			const noteLog = new BpbNoteModel(linenum + 1, new Date(), note.username, "reply_revision_done", []);
			await noteLog.insertNote(nomor, tx);
		})
	},

	// Function to update CC information and BPB status if the updated CC feedback affecting BPB status, by updating the specific CC
	// record, checking if it will affecting the status of BPB and will make a change to the status if neccessary.
	updateCcFeedback: async (nomor: string, data: BpbCcModel, note: BpbNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current BPB data stored inside database.
			const bpb = await BpbHeaderModel.getBpbByNumber(nomor);

			// Create a new model of BPB CC to convert the raw data
			const updatedCc = new BpbCcModel(data.linenum, data.cc, data.ac, data.tanggalAc, data.pic, data.namaFile);

			// If the feedback given is REQUESTING REVIEW and it is from GMG, then this block of codes will be executed.
			// GMG is the special case of REQUESTING REVIEW feedback as she could add new CC automatically if she has mentioned
			// bagian / divisions / departments not in the CC list.
			if (updatedCc.ac === "REQUESTING REVIEW" && updatedCc.cc === "MGMG") {
				const bagianList = await BagianMaster.getBagianMasterList();
				const userList = await User.getUserListAdjustedSuperior();
				let mentions = [...note.mentions];
				let extraAddedMentionsCount = 0;
				const additionalCc: BpbCcModel[] = [];
				
				note.mentions.forEach((mention, index) => {
					const additionalMentions: string[] = [];

					// If the mentioned users is not exist in the CC list, then it will automatically be added to the list
					if (!bpb.ccList.find(cc => cc.cc === mention))
						additionalCc.push(new BpbCcModel(additionalCc.length, mention, "NO ACTION"));

					// Also for every mentioned users, it will be traverse up to the level right under GMG to identify every upper level of the mentioned users,
					// and if there is no mention to the upper level, it will be added. And if the CC also not exist, then it will be added, too.
					let currentLvl = mention.length === 4 ? mention : userList.find(user => user.username === mention)?.superior.substring(0, 4);

					while (currentLvl && currentLvl !== "MGMG") {
						const upperBagian = bagianList.find(bagian => bagian.code === currentLvl);
						if (upperBagian && !mentions.find(bagianCode => bagianCode === upperBagian.code) && !additionalMentions.find(bagianCode => bagianCode === upperBagian.code))
							additionalMentions.push(upperBagian.code);
						if (upperBagian && !bpb.ccList.find(cc => cc.cc === upperBagian.code) && !additionalCc.find(cc => cc.cc === upperBagian.code))
							additionalCc.push(new BpbCcModel(additionalCc.length, upperBagian.code, "NO ACTION"));
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
					let ccList = [...bpb.ccList];
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

					// CC list of the current BPB will be removed, then will be inserted back with new updated list.
					await BpbCcModel.bulkDeleteCc(bpb.nomor, tx);
					await BpbCcModel.bulkInsertCc(bpb.nomor, ccList, tx);

				} else {
					await updatedCc.updateCc(bpb.nomor, tx);
				}
				
			} else {
				// If the current CC is the last CC and the feedback is APPROVE, then BPB will automatically be published to the recipient, the status of the BPB
				// will become PUBLISHED, and the received date will be updated. If current CC give a REVISION feedback, then the BPB will be send back to publisher
				// and the status will become REVISION. If the feedback is REJECT, then the BPB will automatically be closed, the status will become REJECTED, and no
				// progress could be made to the BPB anymore.
				if (updatedCc.ac === "APPROVE" && bpb.ccList[bpb.ccList.length - 1].linenum === updatedCc.linenum) {
					bpb.status = "DONE";
					bpb.tanggalSelesai = new Date();	
				} 
				else if (updatedCc.ac === "REVISION")
					bpb.status = "REVISION";
				else if (updatedCc.ac === "REJECT")
					bpb.status = "REJECTED";
	
				// Update current BPB with changed status
				// Also update the current CC feedback
				await bpb.updateHeader(tx);
				await updatedCc.updateCc(bpb.nomor, tx);

				const requestReviewNoteList = bpb.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
				const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];
				if (bpb.ccList.find(cc => cc.linenum === updatedCc.linenum)?.ac === "REQUESTING REVIEW") {
					const updatedNote = new BpbNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, []);
					updatedNote.updateNote(nomor, tx);
				} else if (bpb.ccList.find(cc => cc.ac === "REQUESTING REVIEW") && lastRequestReview.mentions.find(mention => mention === updatedCc.cc) && note.comment.length > 0) {
					const mentionsToBeRemoved = await getMentionsToBeRemovedList(note.username);
					const updatedNote = new BpbNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
					updatedNote.updateNote(nomor, tx);

					if (updatedNote.mentions.length <= 0) {
						const updatedCcRequestingReview = bpb.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
						if (updatedCcRequestingReview) {
							updatedCcRequestingReview.ac = "NO ACTION";
							updatedCcRequestingReview.updateCc(nomor, tx);
						}
					}
				}
			}
			
			// Generate a new line number for note			
			// If user wrote a note when giving the feedback, then it will create a new Note containing the note written by user. 
			let linenum = await BpbNoteModel.generateLatestNumber(nomor);
			if (note.comment.length > 0) {
				const newNote = new BpbNoteModel(linenum, note.tanggal, note.username, note.comment, note.mentions);
				await newNote.insertNote(bpb.nomor, tx);
				linenum++;
			}

			if (["REVISION", "REJECT", "REQUESTING REVIEW"].includes(updatedCc.ac)) {
				// A new note will be inserted into database if either REVISION, REJECT, or REQUESTING REVIEW feedback was given by the CC to mark the response.
				const mentions = updatedCc.ac === "REQUESTING REVIEW" ? (updatedCc.cc === "MGMG" ? note.mentions : note.mentions.filter(mention => bpb.ccList.map(cc => cc.cc).includes(mention))) : [];
				const noteLog = new BpbNoteModel(linenum, new Date(), updatedCc.cc, (updatedCc.ac === "REVISION" ? "revision_cc" : updatedCc.ac === "REJECT" ? "rejected_cc" : "requesting_review_cc") + (updatedCc.linenum + 1), mentions);
				await noteLog.insertNote(nomor, tx);

				// If GMG give REVISION or REJECT feedback for current BPB, it will be notified to every CC before GMG that have granted the publish of the BPB.
				if (updatedCc.cc === "MGMG" && ["REVISION", "REJECT"].includes(updatedCc.ac)) {
					const bpbNotifList: HelpdeskNotifModel[] = [];
					bpb.ccList.filter(cc => cc.linenum < updatedCc.linenum).forEach(cc => 
						bpbNotifList.push(new HelpdeskNotifModel(cc.cc.length === 4 ? cc.cc.concat("-01") : cc.cc, updatedCc.ac === "REVISION" ? "revision_from_gmg" : "rejected_from_gmg"))
					);

					// Delete all remaining and unread notification of current BPB and replace it with the new one, for all specified users.
					await HelpdeskNotifModel.bulkDeleteNotif(bpb.nomor, tx);
					await HelpdeskNotifModel.bulkInsertNotif(bpb.nomor, bpbNotifList, tx);
				}
			}
		});
	},

	// Function to reply to the CC whose requesting for review to the user. It will remove the user from the mentioned list as it is considered reviewed by
	// the user.
	replyForReview: async (nomor: string, note: BpbNoteModel) => {
		return prisma.$transaction(async (tx) => {
			// Get current BPB data stored inside database.
			const bpb = await BpbHeaderModel.getBpbByNumber(nomor);

			// Get the latest mention note with some mentioned users not yet give their reply for review.
			const requestReviewNoteList = bpb.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc" && note.mentions.length > 0);
			const lastRequestReview = requestReviewNoteList[requestReviewNoteList.length - 1];

			// Get all users or bagian / divisions / departments mentioned that will be removed because of the reply sent by their higher level
			// user which also being mentioned, and update the note to remove that list of mentioned to be remove from the column in database.
			const mentionsToBeRemoved: string[] = await getMentionsToBeRemovedList(note.username);
			const updatedNote = new BpbNoteModel(lastRequestReview.linenum, lastRequestReview.tanggal, lastRequestReview.username, lastRequestReview.comment, lastRequestReview.mentions.filter(mention => !mentionsToBeRemoved.includes(mention) || mentionsToBeRemoved.includes(mention + "-01")));
			updatedNote.updateNote(nomor, tx);

			// If all mentions have commented to the BPB for review asked by a CC, then it will change the CC respond back to 
			// NO ACTION to indicate that the requested review has been given by all mentioned users.
			if (updatedNote.mentions.length <= 0) {
				const updatedCc = bpb.ccList.find(cc => cc.linenum === (Number(updatedNote.comment.substring(20)) - 1))
				if (updatedCc) {
					updatedCc.ac = "NO ACTION";
					updatedCc.updateCc(nomor, tx);
				}
			}
			
			// Generate a new line number for note
			// Create a new Note containing the note written by user
			const linenum = await BpbNoteModel.generateLatestNumber(nomor);
			const noteLog = new BpbNoteModel(linenum, new Date(), note.username, note.comment, []);
			await noteLog.insertNote(nomor, tx);
		});
	},
};

