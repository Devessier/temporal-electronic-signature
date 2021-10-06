<script lang="ts">
	export let url: string;
	export let title: string;

	$: iframeSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
</script>

<iframe height="100%" width="100%" src={iframeSrc} {title} />
