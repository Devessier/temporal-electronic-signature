import {
	agreeDocument,
	cancelProcedure,
	createProcedure,
	fetchProcedureStatus,
	sendConfirmationCode,
	setEmailForCode
} from '$lib/services/procedure';
import { createModel } from 'xstate/lib/model';
import type { ElectronicSignatureProcedureStatus } from '@temporal-electronic-signature/temporal/lib/types';
import { send } from 'xstate';
import type { EventObject } from 'xstate';

const appModel = createModel(
	{
		selectedFile: undefined as File | undefined,

		documentURL: undefined as string | undefined,
		documentPresignedURL: undefined as string | undefined,
		procedureUuid: undefined as string | undefined,
		procedureStatus: undefined as ElectronicSignatureProcedureStatus | undefined
	},
	{
		events: {
			SELECT_FILE: (file: File) => ({ file }),

			CANCEL_PROCEDURE_CREATION: () => ({}),

			CREATE_PROCEDURE: () => ({}),

			PROCEDURE_CREATED: (
				documentURL: string,
				documentPresignedURL: string,
				procedureUuid: string
			) => ({
				documentURL,
				documentPresignedURL,
				procedureUuid
			}),

			SET_PROCEDURE_STATUS: (procedureStatus: ElectronicSignatureProcedureStatus) => ({
				procedureStatus
			}),
			PROCEDURE_STATUS_FETCHING_FAILED: () => ({}),

			CANCEL_SIGNATURE: () => ({}),
			SIGNATURE_CANCELLED: () => ({}),

			CONFIRM_SIGNATURE: () => ({}),
			SIGNATURE_CONFIRMED: () => ({}),

			SELECT_EMAIL: (email: string) => ({ email }),
			EMAIL_SELECTION_CONFIRMED: () => ({}),

			SELECT_CODE: (code: string) => ({ code }),

			SIGNATURE_VALIDATED: () => ({}),
			SIGNATURE_EXPIRED: () => ({})
		}
	}
);

const assignSelectedFile = appModel.assign(
	{
		selectedFile: (_, { file }) => file
	},
	'SELECT_FILE'
);

const resetSelectedFile = appModel.assign(
	{
		selectedFile: undefined
	},
	'SIGNATURE_VALIDATED'
);

const assignProcedureCreated = appModel.assign(
	{
		documentURL: (_, { documentURL }) => documentURL,
		documentPresignedURL: (_, { documentPresignedURL }) => documentPresignedURL,
		procedureUuid: (_, { procedureUuid }) => procedureUuid
	},
	'PROCEDURE_CREATED'
);

const assignProcedureStatus = appModel.assign(
	{
		procedureStatus: (_, { procedureStatus }) => procedureStatus
	},
	'SET_PROCEDURE_STATUS'
);

export const appMachine = appModel.createMachine(
	{
		context: appModel.initialContext,

		initial: 'selectingFile',

		states: {
			selectingFile: {
				on: {
					SELECT_FILE: {
						target: 'selectedFile',

						actions: assignSelectedFile
					}
				}
			},

			selectedFile: {
				on: {
					SELECT_FILE: {
						target: 'selectedFile',

						actions: assignSelectedFile
					},

					CANCEL_PROCEDURE_CREATION: {
						target: 'selectingFile',

						actions: appModel.reset()
					},

					CREATE_PROCEDURE: {
						target: 'signingDocumentSteps'
					}
				}
			},

			signingDocumentSteps: {
				type: 'parallel',

				states: {
					pollingProcedureStatus: {
						initial: 'fetchingProcedureStatus',

						states: {
							fetchingProcedureStatus: {
								invoke: {
									src: 'fetchProcedureStatus'
								},

								on: {
									SET_PROCEDURE_STATUS: [
										{
											cond: (_, { procedureStatus }) => procedureStatus === 'CANCELLED',

											actions: [
												assignProcedureStatus,
												send({
													type: 'SIGNATURE_CANCELLED'
												})
											]
										},

										{
											cond: (_, { procedureStatus }) => procedureStatus === 'VALIDATED',

											actions: [
												assignProcedureStatus,
												send({
													type: 'SIGNATURE_VALIDATED'
												})
											]
										},

										{
											cond: (_, { procedureStatus }) => procedureStatus === 'EXPIRED',

											actions: [
												assignProcedureStatus,
												send({
													type: 'SIGNATURE_EXPIRED'
												})
											]
										},

										{
											target: 'debouncing',

											actions: [
												assignProcedureStatus,
												(_, { procedureStatus }) => {
													console.log('procedureStatus', procedureStatus);
												}
											]
										}
									],

									PROCEDURE_STATUS_FETCHING_FAILED: {
										target: 'debouncing'
									}
								}
							},

							debouncing: {
								after: {
									1_000: {
										target: 'fetchingProcedureStatus'
									}
								}
							}
						}
					},

					steps: {
						initial: 'creatingProcedure',

						states: {
							creatingProcedure: {
								invoke: {
									src: 'createProcedure'
								},

								on: {
									PROCEDURE_CREATED: {
										target: 'confirmingSignature',

										actions: [assignProcedureCreated, 'redirectToViewerPage']
									}
								}
							},

							confirmingSignature: {
								initial: 'idle',

								states: {
									idle: {
										on: {
											CANCEL_SIGNATURE: {
												target: 'sendingCancelSignature'
											},

											CONFIRM_SIGNATURE: {
												target: 'sendingConfirmSignature'
											}
										}
									},

									sendingConfirmSignature: {
										invoke: {
											src: 'agreeDocument'
										}
									},

									sendingCancelSignature: {
										invoke: {
											src: 'cancelProcedure'
										}
									}
								},

								on: {
									SIGNATURE_CONFIRMED: {
										target: 'selectingEmail',

										actions: 'redirectToEmailPage'
									}
								}
							},

							selectingEmail: {
								initial: 'idle',

								states: {
									idle: {
										on: {
											SELECT_EMAIL: {
												target: 'sendingEmail'
											}
										}
									},

									sendingEmail: {
										invoke: {
											src: 'sendEmail'
										}
									}
								},

								on: {
									EMAIL_SELECTION_CONFIRMED: {
										target: 'confirmingCode',

										actions: 'redirectToConfirmationCodePage'
									}
								}
							},

							confirmingCode: {
								initial: 'idle',

								states: {
									idle: {},

									sendingCode: {
										invoke: {
											src: 'sendCode'
										}
									}
								},

								on: {
									SELECT_CODE: {
										target: 'confirmingCode.sendingCode'
									}
								}
							}
						}
					}
				},

				on: {
					SIGNATURE_CANCELLED: {
						target: 'selectingFile',

						actions: [appModel.reset(), 'redirectToSignatureCancelledPage']
					},

					SIGNATURE_VALIDATED: {
						target: 'selectingFile',

						actions: [resetSelectedFile, 'redirectToSignatureValidatedPage']
					},

					SIGNATURE_EXPIRED: {
						target: 'selectingFile',

						actions: [appModel.reset(), 'redirectToSignatureExpiredPage']
					}
				}
			}
		},
		predictableActionArguments: true,
		preserveActionOrder: true,
	},
	{
		services: {
			createProcedure:
				({ selectedFile }) =>
				async (sendBack) => {
					try {
						if (selectedFile === undefined) {
							throw new Error('Can not create a procedure with an undefined document');
						}

						const { documentURL, documentPresignedURL, procedureUuid } = await createProcedure(
							selectedFile
						);

						console.log('document url, procedure uuid', documentURL, procedureUuid);

						sendBack({
							type: 'PROCEDURE_CREATED',
							documentURL,
							documentPresignedURL,
							procedureUuid
						});
					} catch (err) {
						console.error(err);
					}
				},

			fetchProcedureStatus:
				({ procedureUuid }) =>
				async (sendBack) => {
					try {
						if (procedureUuid === undefined) {
							throw new Error(
								'fetchProcedureStatus service can only be called when proceduire uuid has been set'
							);
						}

						const status = await fetchProcedureStatus(procedureUuid);

						sendBack({
							type: 'SET_PROCEDURE_STATUS',
							procedureStatus: status
						});
					} catch (err) {
						console.error(err);

						sendBack({
							type: 'PROCEDURE_STATUS_FETCHING_FAILED'
						});
					}
				},

			cancelProcedure:
				({ procedureUuid }) =>
				async (sendBack) => {
					try {
						if (procedureUuid === undefined) {
							throw new Error(
								'cancelProcedure service can only be called when proceduire uuid has been set'
							);
						}

						await cancelProcedure(procedureUuid);

						sendBack({
							type: 'SIGNATURE_CANCELLED'
						});
					} catch (err) {
						console.error(err);
					}
				},

			agreeDocument:
				({ procedureUuid }) =>
				async (sendBack) => {
					try {
						if (procedureUuid === undefined) {
							throw new Error(
								'agreeDocument service can only be called when proceduire uuid has been set'
							);
						}

						await agreeDocument(procedureUuid);

						sendBack({
							type: 'SIGNATURE_CONFIRMED'
						});
					} catch (err) {
						console.error(err);
					}
				},

			sendEmail:
				({ procedureUuid }, event) =>
				async (sendBack) => {
					try {
						assertEventType(event, 'SELECT_EMAIL');

						if (procedureUuid === undefined) {
							throw new Error(
								'sendEmail service can only be called when proceduire uuid has been set'
							);
						}

						await setEmailForCode({
							procedureUuid,
							email: event.email
						});

						sendBack({
							type: 'EMAIL_SELECTION_CONFIRMED'
						});
					} catch (err) {
						console.error(err);
					}
				},

			sendCode:
				({ procedureUuid }, event) =>
				async () => {
					try {
						assertEventType(event, 'SELECT_CODE');

						if (procedureUuid === undefined) {
							throw new Error(
								'sendEmail service can only be called when proceduire uuid has been set'
							);
						}

						await sendConfirmationCode({
							procedureUuid,
							code: event.code
						});
					} catch (err) {
						console.error(err);
					}
				}
		}
	}
);

function assertEventType<TE extends EventObject, TType extends TE['type']>(
	event: TE,
	eventType: TType
): asserts event is TE & { type: TType } {
	if (event.type !== eventType) {
		throw new Error(`Invalid event: expected "${eventType}", got "${event.type}"`);
	}
}
