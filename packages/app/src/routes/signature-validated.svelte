<script lang="ts">
	import { useSelector } from '@xstate/svelte';
	import AppLayout from '$lib/AppLayout.svelte';
	import { useAppContext } from '$lib/contexts/app';
	import PdfViewer from '$lib/PdfViewer.svelte';

	const { appService } = useAppContext();
	
	const documentURL = useSelector(appService, (state) => state.context.documentPresignedURL);
</script>

<AppLayout title="Signature validated">
	<div class="mt-2 flex flex-col flex-grow">
		{#if $documentURL !== undefined}
			<div class="flex-grow grid grid-cols-1 grid-rows-1">
				<PdfViewer url={$documentURL} title="Signed document" />
			</div>
		{/if}
	</div>
</AppLayout>
