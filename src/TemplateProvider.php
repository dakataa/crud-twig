<?php

namespace Dakataa\Crud\Twig;

use Exception;
use Symfony\Component\DependencyInjection\Container;
use Twig\Environment;

class TemplateProvider
{
	public function __construct(protected Environment $twig)
	{

	}

	protected function getTemplateDirectoryByClass(string $controllerClass): string
	{
		$controllerPatterns = '#Controller\\\(?<class>.+)Controller$#';
		preg_match($controllerPatterns, $controllerClass, $matches);

		if (empty($matches['class'])) {
			throw new Exception('Invalid Controller Class.');
		}

		return rtrim(
			Container::underscore(str_replace('\\', '/', preg_replace('/Action$/i', '', $matches['class']))),
			'/'
		);
	}

	protected function getTemplate(string $template, string $fallbackTemplate = null): string
	{
		if (!$this->twig) {
			throw new Exception('Missing Twig Templating Engine.');
		}

		$templatePath = sprintf(
			'%s/%s.html.twig',
			$this->getTemplateDirectoryByClass($this->getControllerClass()),
			$template
		);

		if (!$this->twig->getLoader()->exists($templatePath)) {
			$templatePath = sprintf('@DakataaCrud/%s.html.twig', $fallbackTemplate ?: $template);
		}

		return $templatePath;
	}
}
