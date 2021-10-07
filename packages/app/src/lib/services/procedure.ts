import redaxios from 'redaxios';
import type { ElectronicSignatureProcedureStatus } from '@temporal-electronic-signature/temporal/lib/interfaces';

interface CreateProcedureResponse {
	procedureUuid: string;
	documentURL: string;
	documentPresignedURL: string
}

export async function createProcedure(document: File): Promise<CreateProcedureResponse> {
	const formData = new FormData();
	formData.set('document', document);

	const response = await redaxios.post('http://localhost:3333/procedure/create', formData);

	return response.data;
}

export async function fetchProcedureStatus(
	procedureUuid: string
): Promise<ElectronicSignatureProcedureStatus> {
	const response = await redaxios.get(`http://localhost:3333/procedure/${procedureUuid}`);

	return response.data;
}
